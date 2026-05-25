/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { downloadDynamicInstallerZip } from '../lib/installerGenerator';
import { DMG_BASE64 } from '../lib/dmgBase64';

interface DmgDownloadModalProps {
  isDarkMode: boolean;
}

// G→N icon: blue rounded square, white letterforms
// G: top arc CCW large → right, crossbar left. Opening at upper-right.
// →: shaft + chevron arrowhead
// N: two verticals + diagonal
const GNextIcon = ({ size = 64 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="52" fill="#0F4BFF"/>
    {/* G — arc from top (58,92) CCW large arc to right (94,128), then crossbar left */}
    <path d="M 58 92 A 36 36 0 1 0 94 128 L 58 128"
      stroke="white" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    {/* → — shaft + chevron */}
    <line x1="112" y1="128" x2="148" y2="128" stroke="white" strokeWidth="12" strokeLinecap="round"/>
    <polyline points="136,114 152,128 136,142"
      stroke="white" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    {/* N — two verticals + diagonal */}
    <line x1="166" y1="172" x2="166" y2="84" stroke="white" strokeWidth="13" strokeLinecap="round"/>
    <line x1="166" y1="84"  x2="206" y2="172" stroke="white" strokeWidth="13" strokeLinecap="round"/>
    <line x1="206" y1="172" x2="206" y2="84"  stroke="white" strokeWidth="13" strokeLinecap="round"/>
  </svg>
);

export default function DmgDownloadModal({ isDarkMode }: DmgDownloadModalProps) {
  const [status, setStatus] = React.useState<'idle' | 'downloading' | 'done'>('idle');
  const [showGatekeeperNote, setShowGatekeeperNote] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const downloadApp = async () => {
    setStatus('downloading');
    try {
      if (!DMG_BASE64) {
        await downloadDynamicInstallerZip();
      } else {
        const binary = window.atob(DMG_BASE64.trim());
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'G-Next_macOS_Installer.dmg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      setStatus('done');
    } catch (e) {
      console.error(e);
      setStatus('idle');
    }
  };

  const downloadZip = async () => {
    setStatus('downloading');
    try {
      await downloadDynamicInstallerZip();
      setStatus('done');
    } catch (e) { setStatus('idle'); }
  };

  const copyUrl = () => navigator.clipboard.writeText(window.location.href);

  return (
    <div className="min-h-full flex flex-col" style={{ background: '#0F4BFF' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-20 text-center">

        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <GNextIcon size={96} />
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-white font-black tracking-tighter leading-none"
            style={{ fontSize: 'clamp(56px, 8vw, 96px)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            G→Next
          </h1>
          <p className="text-white/50 mt-3 text-lg font-medium tracking-wide"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Focus Workspace
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex flex-col items-center gap-4 w-full max-w-xs"
        >
          <button
            onClick={downloadApp}
            disabled={status === 'downloading'}
            className="w-full flex items-center justify-center gap-3 bg-white text-[#0F4BFF] font-black text-base rounded-2xl px-8 py-4 hover:bg-blue-50 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 shadow-xl shadow-black/20"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {status === 'downloading' ? (
              <><span className="w-4 h-4 border-2 border-[#0F4BFF]/30 border-t-[#0F4BFF] rounded-full animate-spin" />Downloading…</>
            ) : status === 'done' ? (
              <><span className="text-lg">✓</span> Downloaded</>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download for Mac
              </>
            )}
          </button>
          <p className="text-white/40 text-xs" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            macOS 10.15+ · Apple Silicon + Intel
          </p>
        </motion.div>

        <AnimatePresence>
          {status === 'done' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-white/10 backdrop-blur rounded-2xl px-6 py-5 max-w-sm w-full text-left"
            >
              <p className="text-white font-bold text-sm mb-3" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>Install steps</p>
              <ol className="space-y-2 text-white/80 text-sm" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <li><span className="text-white/40 mr-2">1.</span>Open the downloaded <strong className="text-white">.dmg</strong> file</li>
                <li><span className="text-white/40 mr-2">2.</span>Drag <strong className="text-white">G-Next.app</strong> to Applications</li>
                <li><span className="text-white/40 mr-2">3.</span>Launch from Spotlight or Launchpad</li>
              </ol>
              <button
                onClick={() => setShowGatekeeperNote(v => !v)}
                className="mt-4 text-white/50 text-xs underline underline-offset-2 hover:text-white/70 transition-colors"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                Seeing a security warning? ↓
              </button>
              <AnimatePresence>
                {showGatekeeperNote && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-3 bg-white/10 rounded-xl p-4 text-white/80 text-xs space-y-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      <p><strong className="text-white">macOS says "unverified developer"?</strong></p>
                      <p>Right-click <strong className="text-white">G-Next.app</strong> → <strong className="text-white">Open</strong> → click <strong className="text-white">Open</strong> again. macOS remembers your choice.</p>
                      <p className="text-white/50">Or run the included <code className="bg-white/10 px-1 rounded">install_gnext.sh</code> — it clears the flag automatically.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="w-12 h-px bg-white/20 my-10" />

        <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.4 }}
          className="text-center max-w-xs"
        >
          <p className="text-white/50 text-sm leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            On Mac? Skip the download —<br />
            open in <strong className="text-white/80">Safari</strong> then{' '}
            <strong className="text-white/80">File → Add to Dock</strong>
            <br /><span className="text-white/30 text-xs">Zero install · No security warnings</span>
          </p>
          <button onClick={copyUrl}
            className="mt-4 text-white/40 text-xs border border-white/20 rounded-full px-4 py-1.5 hover:text-white/70 hover:border-white/40 transition-all"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Copy link
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-12 text-center">
          <button onClick={() => setShowAdvanced(v => !v)}
            className="text-white/25 text-xs hover:text-white/40 transition-colors"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {showAdvanced ? 'Hide' : 'More options'}
          </button>
          <AnimatePresence>
            {showAdvanced && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 flex flex-col gap-2 max-w-xs mx-auto">
                  <button onClick={downloadZip}
                    className="text-white/50 text-xs border border-white/15 rounded-xl px-5 py-2.5 hover:text-white/70 hover:border-white/30 transition-all text-left"
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    <span className="block text-white/30 text-[10px] uppercase tracking-widest mb-0.5">Alternative</span>
                    Download installer scripts (.zip)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="px-8 py-5 flex items-center justify-between border-t border-white/10">
        <span className="text-white/25 text-xs" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>G→Next v1.4.0</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/25 text-xs" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>Live</span>
        </div>
      </div>
    </div>
  );
}
