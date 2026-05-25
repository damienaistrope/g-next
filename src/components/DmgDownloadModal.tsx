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

const GNextIcon = ({ size = 64 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="56" fill="#0F4BFF"/>
    <text
      fontFamily="'Google Sans Text', 'Google Sans', system-ui, sans-serif"
      fontWeight="700"
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
    >
      <tspan x="72"  y="128" fontSize="80">G</tspan>
      <tspan x="128" y="118" fontSize="68">→</tspan>
      <tspan x="186" y="128" fontSize="80">N</tspan>
    </text>
  </svg>
);

type Step = 'idle' | 'downloaded' | 'done';

export default function DmgDownloadModal({ isDarkMode }: DmgDownloadModalProps) {
  const [step, setStep] = React.useState<Step>('idle');
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Primary download: the .command installer ZIP (app + installer script together)
  const downloadInstaller = async () => {
    try {
      if (!DMG_BASE64) {
        await downloadDynamicInstallerZip();
      } else {
        // Download the disk image which contains the app + Install G-Next.command
        const binary = window.atob(DMG_BASE64.trim());
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'G-Next-Installer.dmg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      setStep('downloaded');
    } catch (e) {
      console.error(e);
    }
  };

  const copyUrl = () => navigator.clipboard.writeText(window.location.href);

  return (
    <div className="min-h-full flex flex-col" style={{ background: '#0F4BFF' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 text-center">

        {/* Icon */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <GNextIcon size={96} />
        </motion.div>

        {/* Wordmark */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-white font-black tracking-tighter leading-none"
            style={{ fontSize: 'clamp(56px, 8vw, 88px)', fontFamily: "'Google Sans Text', system-ui, sans-serif" }}>
            G→Next
          </h1>
          <p className="text-white/50 mt-3 text-lg font-medium tracking-wide"
            style={{ fontFamily: "'Google Sans Text', system-ui, sans-serif" }}>
            Focus Workspace
          </p>
        </motion.div>

        {/* ── Step 1: Download button ─────────────────────────────── */}
        <AnimatePresence mode="wait">
          {step === 'idle' && (
            <motion.div key="idle"
              initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mt-12 flex flex-col items-center gap-3 w-full max-w-xs"
            >
              <button onClick={downloadInstaller}
                className="w-full flex items-center justify-center gap-3 bg-white text-[#0F4BFF] font-black text-base rounded-2xl px-8 py-4 hover:bg-blue-50 active:scale-[0.98] transition-all shadow-xl shadow-black/20"
                style={{ fontFamily: "'Google Sans Text', system-ui, sans-serif" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download for Mac
              </button>
              <p className="text-white/40 text-xs" style={{ fontFamily: "system-ui, sans-serif" }}>
                macOS 10.15+ · Apple Silicon + Intel
              </p>
            </motion.div>
          )}

          {/* ── Step 2: Install instructions (after download) ──────── */}
          {step === 'downloaded' && (
            <motion.div key="downloaded"
              initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="mt-10 w-full max-w-sm"
            >
              {/* Big checkmark */}
              <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>

              <p className="text-white font-black text-xl mb-6"
                style={{ fontFamily: "'Google Sans Text', system-ui, sans-serif" }}>
                Now install it
              </p>

              {/* Steps */}
              <div className="space-y-3 text-left">
                {[
                  { n: '1', text: <>Open the <strong className="text-white">G-Next-Installer.dmg</strong></> },
                  { n: '2', text: <>Double-click <strong className="text-white">Install G-Next.command</strong></> },
                  { n: '3', text: <>macOS asks <em className="text-white/80">"are you sure?"</em> — click <strong className="text-white">Open</strong></> },
                  { n: '4', text: <>Terminal runs the install, then G-Next opens automatically</> },
                ].map(({ n, text }) => (
                  <div key={n} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/20 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5"
                      style={{ fontFamily: "system-ui, sans-serif" }}>{n}</span>
                    <p className="text-white/75 text-sm leading-relaxed"
                      style={{ fontFamily: "'Google Sans Text', system-ui, sans-serif" }}>{text}</p>
                  </div>
                ))}
              </div>

              {/* Why this works note */}
              <div className="mt-5 bg-white/10 rounded-xl p-4 text-left">
                <p className="text-white/50 text-xs leading-relaxed"
                  style={{ fontFamily: "system-ui, sans-serif" }}>
                  <strong className="text-white/70">Why the .command file?</strong> Unlike double-clicking the app directly, the installer script removes the internet-download security flag before G-Next first opens — so macOS never shows the malware warning.
                </p>
              </div>

              <button onClick={() => setStep('done')}
                className="mt-4 w-full py-3 rounded-xl border border-white/20 text-white/60 text-sm font-medium hover:text-white/80 hover:border-white/40 transition-all"
                style={{ fontFamily: "'Google Sans Text', system-ui, sans-serif" }}>
                Installed ✓
              </button>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div key="done"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="mt-10 text-center"
            >
              <p className="text-white/60 text-base"
                style={{ fontFamily: "'Google Sans Text', system-ui, sans-serif" }}>
                You're all set 🎉
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Divider ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="w-12 h-px bg-white/20 my-10" />

        {/* ── Safari Add to Dock option ────────────────────────────── */}
        <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }}
          className="text-center max-w-xs"
        >
          <p className="text-white/50 text-sm leading-relaxed"
            style={{ fontFamily: "'Google Sans Text', system-ui, sans-serif" }}>
            On Mac? Skip the download entirely —<br />
            open in <strong className="text-white/80">Safari</strong> → <strong className="text-white/80">File → Add to Dock</strong>
            <br /><span className="text-white/30 text-xs">Zero install · Zero security warnings</span>
          </p>
          <button onClick={copyUrl}
            className="mt-4 text-white/40 text-xs border border-white/20 rounded-full px-4 py-1.5 hover:text-white/70 hover:border-white/40 transition-all"
            style={{ fontFamily: "system-ui, sans-serif" }}>
            Copy link for Safari
          </button>
        </motion.div>

        {/* ── Advanced (collapsed) ─────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
          className="mt-10 text-center"
        >
          <button onClick={() => setShowAdvanced(v => !v)}
            className="text-white/25 text-xs hover:text-white/40 transition-colors"
            style={{ fontFamily: "system-ui, sans-serif" }}>
            {showAdvanced ? 'Hide' : 'More options'}
          </button>
          <AnimatePresence>
            {showAdvanced && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-3 max-w-xs mx-auto space-y-2"
              >
                <button onClick={downloadInstaller}
                  className="w-full text-white/40 text-xs border border-white/15 rounded-xl px-5 py-2.5 hover:text-white/60 hover:border-white/25 transition-all text-left"
                  style={{ fontFamily: "system-ui, sans-serif" }}>
                  <span className="block text-white/25 text-[10px] uppercase tracking-widest mb-0.5">Disk image</span>
                  Download G-Next-Installer.dmg
                </button>
                <button onClick={() => downloadDynamicInstallerZip()}
                  className="w-full text-white/40 text-xs border border-white/15 rounded-xl px-5 py-2.5 hover:text-white/60 hover:border-white/25 transition-all text-left"
                  style={{ fontFamily: "system-ui, sans-serif" }}>
                  <span className="block text-white/25 text-[10px] uppercase tracking-widest mb-0.5">Scripts only</span>
                  Download installer scripts (.zip)
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="px-8 py-5 flex items-center justify-between border-t border-white/10">
        <span className="text-white/25 text-xs" style={{ fontFamily: "system-ui, sans-serif" }}>G→Next v1.4.0</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/25 text-xs" style={{ fontFamily: "system-ui, sans-serif" }}>Live</span>
        </div>
      </div>
    </div>
  );
}
