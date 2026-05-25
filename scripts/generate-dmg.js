/**
 * G-Next DMG/ISO Builder
 * 
 * Builds an ISO 9660 disk image containing the G-Next.app bundle
 * and installer scripts, then base64-encodes it into src/lib/dmgBase64.ts.
 * 
 * Works on Linux (no genisoimage required) and macOS (uses hdiutil if available).
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const SRC_LIB_DIR = path.join(ROOT_DIR, 'src', 'lib');
const TMP_DIR = path.join(ROOT_DIR, 'tmp_dmg_src');

const DMG_PATH = path.join(PUBLIC_DIR, 'G-Next_macOS_Installer.dmg');
const OUTPUT_TS_PATH = path.join(SRC_LIB_DIR, 'dmgBase64.ts');

// ─── ISO 9660 builder (pure Node.js, no native dependencies) ────────────────

const SECTOR = 2048;

function pad(buf) {
  const rem = buf.length % SECTOR;
  if (!rem) return buf;
  const padded = Buffer.alloc(buf.length + (SECTOR - rem));
  buf.copy(padded);
  return padded;
}

function both16(n) {
  const b = Buffer.alloc(4);
  b.writeUInt16LE(n, 0);
  b.writeUInt16BE(n, 2);
  return b;
}

function both32(n) {
  const b = Buffer.alloc(8);
  b.writeUInt32LE(n, 0);
  b.writeUInt32BE(n, 4);
  return b;
}

function isoDate(d = new Date()) {
  return Buffer.from([
    d.getUTCFullYear() - 1900,
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
    0
  ]);
}

function dirRecord(nameBytes, extentLba, dataLen, isDir = false) {
  const nameLen = nameBytes.length;
  let recLen = 33 + nameLen;
  if (recLen % 2) recLen++;
  const rec = Buffer.alloc(recLen);
  rec[0] = recLen;
  rec[1] = 0;
  both32(extentLba).copy(rec, 2);
  both32(dataLen).copy(rec, 10);
  isoDate().copy(rec, 18);
  rec[25] = isDir ? 0x02 : 0x00;
  rec[26] = 0; rec[27] = 0;
  both16(1).copy(rec, 28);
  rec[32] = nameLen;
  nameBytes.copy(rec, 33);
  return rec;
}

function buildISO(volumeName, filesMap) {
  // filesMap: { 'path/in/iso': Buffer or local_path_string }
  
  // Discover all directories
  const dirSet = new Set(['']);
  for (const isoPath of Object.keys(filesMap)) {
    const parts = isoPath.split('/');
    for (let i = 0; i < parts.length - 1; i++) {
      dirSet.add(parts.slice(0, i + 1).join('/'));
    }
  }
  const dirs = [...dirSet].sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b));
  const dirIdx = {};
  dirs.forEach((d, i) => { dirIdx[d] = i; });

  const DIR_START = 18;
  const dirLBAs = {};
  dirs.forEach((d, i) => { dirLBAs[d] = DIR_START + i; });

  // Lay out files
  let fileLBA = DIR_START + dirs.length;
  const fileLayouts = [];
  for (const [isoPath, src] of Object.entries(filesMap)) {
    const data = typeof src === 'string' ? fs.readFileSync(src) : src;
    const sectors = Math.ceil(data.length / SECTOR) || 1;
    fileLayouts.push({ isoPath, data, lba: fileLBA, size: data.length });
    fileLBA += sectors;
  }

  const totalSectors = fileLBA;

  // Build directory sectors
  const dirBufs = {};
  for (const d of dirs) {
    const lba = dirLBAs[d];
    const parent = d.includes('/') ? d.slice(0, d.lastIndexOf('/')) : '';
    const parentLba = dirLBAs[parent] ?? lba;
    const chunks = [
      dirRecord(Buffer.from([0x00]), lba, SECTOR, true),
      dirRecord(Buffer.from([0x01]), parentLba, SECTOR, true),
    ];
    // child dirs
    for (const child of dirs) {
      if (!child) continue;
      const parentOfChild = child.includes('/') ? child.slice(0, child.lastIndexOf('/')) : '';
      if (parentOfChild === d) {
        const name = child.split('/').pop().toUpperCase();
        chunks.push(dirRecord(Buffer.from(name, 'ascii'), dirLBAs[child], SECTOR, true));
      }
    }
    // files
    for (const { isoPath, lba: fLba, size } of fileLayouts) {
      const fileDir = isoPath.includes('/') ? isoPath.slice(0, isoPath.lastIndexOf('/')) : '';
      if (fileDir === d) {
        const name = isoPath.split('/').pop().toUpperCase() + ';1';
        chunks.push(dirRecord(Buffer.from(name, 'ascii'), fLba, size, false));
      }
    }
    dirBufs[d] = pad(Buffer.concat(chunks));
  }

  // Build PVD
  const pvd = Buffer.alloc(SECTOR);
  pvd[0] = 1;
  pvd.write('CD001', 1, 'ascii');
  pvd[6] = 1;
  pvd.write(volumeName.padEnd(32, ' ').slice(0, 32), 8, 'ascii');
  both32(totalSectors).copy(pvd, 80);
  both16(1).copy(pvd, 120);
  both16(1).copy(pvd, 122);
  both16(SECTOR).copy(pvd, 128);
  const rootRec = dirRecord(Buffer.from([0x00]), dirLBAs[''], SECTOR, true);
  rootRec.copy(pvd, 156, 0, 34);

  // VDST
  const vdst = Buffer.alloc(SECTOR);
  vdst[0] = 255;
  vdst.write('CD001', 1, 'ascii');
  vdst[6] = 1;

  const chunks = [
    Buffer.alloc(16 * SECTOR), // system area
    pvd,
    vdst,
    ...dirs.map(d => dirBufs[d]),
    ...fileLayouts.map(({ data }) => pad(data)),
  ];
  return Buffer.concat(chunks);
}

// ─── Main ────────────────────────────────────────────────────────────────────

try {
  console.log('[DMG Builder] Building G-Next macOS installer...');

  // Try hdiutil on macOS first
  const isMac = process.platform === 'darwin';
  let dmgBuilt = false;

  if (isMac) {
    try {
      if (fs.existsSync(TMP_DIR)) fs.rmSync(TMP_DIR, { recursive: true });
      fs.mkdirSync(TMP_DIR);
      const appSrc = path.join(PUBLIC_DIR, 'G-Next.app');
      if (fs.existsSync(appSrc)) {
        fs.cpSync(appSrc, path.join(TMP_DIR, 'G-Next.app'), { recursive: true });
      }
      fs.copyFileSync(path.join(PUBLIC_DIR, 'install_gnext.sh'), path.join(TMP_DIR, 'install_gnext.sh'));
      fs.copyFileSync(path.join(PUBLIC_DIR, 'gnext_launcher.command'), path.join(TMP_DIR, 'gnext_launcher.command'));
      
      if (fs.existsSync(DMG_PATH)) fs.rmSync(DMG_PATH);
      execSync(`hdiutil create -volname "G-Next Installer" -srcfolder "${TMP_DIR}" -ov -format UDZO "${DMG_PATH}"`, { stdio: 'inherit' });
      console.log('[DMG Builder] hdiutil succeeded — proper Apple UDIF DMG created.');
      dmgBuilt = true;
    } catch (e) {
      console.warn('[DMG Builder] hdiutil failed, falling back to ISO builder:', e.message);
    } finally {
      if (fs.existsSync(TMP_DIR)) fs.rmSync(TMP_DIR, { recursive: true });
    }
  }

  if (!dmgBuilt) {
    console.log('[DMG Builder] Building ISO 9660 disk image (mountable on macOS)...');
    
    const filesMap = {};
    
    // Add G-Next.app contents
    const appDir = path.join(PUBLIC_DIR, 'G-Next.app');
    if (fs.existsSync(appDir)) {
      function addDir(dir, prefix) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const fullPath = path.join(dir, entry.name);
          const isoPath = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.isDirectory()) {
            addDir(fullPath, isoPath);
          } else {
            filesMap[isoPath] = fullPath;
          }
        }
      }
      addDir(appDir, 'G-Next.app');
    }
    
    filesMap['install_gnext.sh'] = path.join(PUBLIC_DIR, 'install_gnext.sh');
    filesMap['gnext_launcher.command'] = path.join(PUBLIC_DIR, 'gnext_launcher.command');
    filesMap['README.txt'] = Buffer.from(`G-Next Focus Workspace — macOS Installer\n\n1. Run install_gnext.sh to install\n2. Or drag G-Next.app to Applications\n3. The app will ask for your server URL on first launch\n\nTo run the server locally: npm install && npm run dev (http://localhost:3000)\n`);
    
    const isoBuffer = buildISO('G-NEXT INSTALL', filesMap);
    fs.writeFileSync(DMG_PATH, isoBuffer);
    console.log(`[DMG Builder] ISO image built: ${(isoBuffer.length / 1024).toFixed(1)} KB`);
  }

  // Encode to base64 and write TypeScript
  console.log('[DMG Builder] Encoding to base64...');
  const dmgBuffer = fs.readFileSync(DMG_PATH);
  const dmgBase64 = dmgBuffer.toString('base64');

  if (!fs.existsSync(SRC_LIB_DIR)) fs.mkdirSync(SRC_LIB_DIR, { recursive: true });
  
  fs.writeFileSync(OUTPUT_TS_PATH, `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Auto-generated by scripts/generate-dmg.js — DO NOT EDIT DIRECTLY.
// Contains the G-Next macOS Installer as a base64-encoded disk image.
export const DMG_BASE64: string = ${JSON.stringify(dmgBase64)};
`, 'utf-8');

  console.log(`[DMG Builder] Done! ${(dmgBase64.length / 1024).toFixed(1)} KB base64 written to dmgBase64.ts`);
} catch (err) {
  console.error('[DMG Builder] Build failed:', err);
  process.exit(1);
}
