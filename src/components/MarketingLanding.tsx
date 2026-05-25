/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Download, 
  ArrowRight, 
  ChevronRight, 
  Monitor, 
  Terminal, 
  Cpu, 
  ShieldCheck, 
  Lock, 
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Inbox,
  Settings,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { downloadDynamicInstallerZip } from '../lib/installerGenerator';
import { DMG_BASE64 } from '../lib/dmgBase64';

interface MarketingLandingProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onEnterApp: () => void;
}

export default function MarketingLanding({ 
  isDarkMode, 
  setIsDarkMode, 
  onEnterApp 
}: MarketingLandingProps) {
  const [activeTab, setActiveTab] = React.useState<'menubar' | 'main_app' | 'focus_widget'>('menubar');
  const [customDownloadUrl, setCustomDownloadUrl] = React.useState<string>(() => {
    return localStorage.getItem('gnext_custom_download_url') || '';
  });
  const [copiedText, setCopiedText] = React.useState<boolean>(false);
  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);

  // Trigger Dynamic Download (ZIP fallback)
  const handleDownload = async () => {
    try {
      if (customDownloadUrl.trim()) {
        const link = document.createElement('a');
        link.href = customDownloadUrl.trim();
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        await downloadDynamicInstallerZip();
      }
    } catch (err) {
      console.error('Failed to compile dynamic installer in browser', err);
    }
  };

  // Direct Static file download (Constructed 100% in-browser from bundled Base64)
  const downloadFile = (ext: 'dmg' | 'iso') => {
    if (customDownloadUrl.trim()) {
      const link = document.createElement('a');
      link.href = customDownloadUrl.trim();
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    try {
      if (!DMG_BASE64) {
        throw new Error('DMG/ISO Base64 data is not available. Please compile the production build first.');
      }
      const binaryString = window.atob(DMG_BASE64.trim());
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `G-Next_macOS_Installer.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn(`In-memory download generated for .${ext} failed, falling back to direct host download link:`, err);
      const loc = window.location;
      let folderPath = loc.pathname;
      if (/\.[a-zA-Z0-9]+$/.test(folderPath)) {
        folderPath = folderPath.substring(0, folderPath.lastIndexOf('/'));
      }
      if (folderPath && !folderPath.endsWith('/')) {
        folderPath += '/';
      }
      const fallbackUrl = loc.origin + folderPath + `G-Next_macOS_Installer.dmg`;
      const link = document.createElement('a');
      link.href = fallbackUrl;
      link.download = `G-Next_macOS_Installer.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyInstallCommand = () => {
    navigator.clipboard.writeText('unzip G-Next_macOS_Installer.zip && chmod +x install_gnext.sh && ./install_gnext.sh');
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className={`w-full min-h-screen font-sans antialiased transition-all duration-300 ${
      isDarkMode ? 'dark bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-800'
    }`}>
      {/* Decorative Sonoma glow elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full filter blur-[120px] opacity-20 mix-blend-screen transition-all duration-700 ${
          isDarkMode ? 'bg-indigo-600' : 'bg-indigo-200'
        }`} />
        <div className={`absolute top-1/3 right-10 w-[500px] h-[500px] rounded-full filter blur-[140px] opacity-15 mix-blend-screen transition-all duration-700 ${
          isDarkMode ? 'bg-sky-500' : 'bg-sky-150'
        }`} />
        <div className={`absolute -bottom-20 left-1/4 w-[450px] h-[450px] rounded-full filter blur-[100px] opacity-10 mix-blend-screen transition-all duration-700 ${
          isDarkMode ? 'bg-emerald-500' : 'bg-emerald-150'
        }`} />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md border-b transition-all duration-200 bg-opacity-70 dark:bg-opacity-70 bg-white/70 dark:bg-neutral-950/70 border-neutral-200/50 dark:border-neutral-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Minimal Macintosh Apple-inspired logo */}
            <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-sky-500/10">
              G→
            </div>
            <span className="font-extrabold text-base tracking-tight text-neutral-900 dark:text-neutral-50">G-Next Sonoma</span>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-550/15 text-emerald-500 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
              v1.0.4
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-neutral-500 dark:text-neutral-400">
            <a href="#features" className="hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors">Features</a>
            <a href="#install" className="hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors">Installation</a>
            <a href="#security" className="hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors">Security</a>
          </nav>

          <div className="flex items-center space-x-4">
            {/* Toggle dark mode */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg hover:bg-neutral-500/10 transition-colors text-neutral-400 dark:text-neutral-500"
              title="Toggle Light/Dark"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {/* Developer interactive entry */}
            <button
              onClick={onEnterApp}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-250 dark:hover:bg-neutral-850 text-neutral-800 dark:text-neutral-200 flex items-center space-x-1.5 cursor-pointer hover:scale-[1.01] transition-all duration-150"
            >
              <Terminal className="w-3.5 h-3.5 text-sky-500" />
              <span>Interactive Container Simulator</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center space-y-8">
        <div id="hero-title" className="space-y-4 max-w-3xl mx-auto">
          <span className="text-[10px] font-bold text-sky-500 dark:text-sky-400 uppercase tracking-widest bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
            Certified In-House Standalone App
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-950 dark:text-neutral-50 leading-tight">
            Bring your scheduler to the <span className="bg-gradient-to-r from-sky-450 to-indigo-500 bg-clip-text text-transparent">macOS Desktop</span>
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            G-Next Sonoma is a lightweight, corporate-approved desktop applet. Track work calendars, protect focus schedules, and prevent meetings from overflowing—directly from your native Apple Menu Bar.
          </p>
        </div>

        {/* Primary Call to Action Download Card */}
        <div className="max-w-md mx-auto relative group">
          <div className="absolute inset-x-0 -bottom-1 h-14 bg-gradient-to-r from-sky-550 to-indigo-500 rounded-2xl filter blur-xl opacity-20 group-hover:opacity-35 transition-all duration-300" />
          
          <div className={`relative p-6 rounded-2xl border shadow-xl flex flex-col items-center justify-center text-center space-y-4 transition-all duration-150 ${
            isDarkMode 
              ? 'bg-neutral-900/95 border-neutral-800/60' 
              : 'bg-white border-neutral-200'
          }`}>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-1">
              <Download className="w-6 h-6 animate-bounce" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight">Download G-Next Client Package</h2>
              <p className="text-xs text-neutral-400">
                Self-repairing macOS standalone installer (ZIP / Apple Silicon & Intel). Dynamically configured in real time to match this exact active hosting environment.
              </p>
            </div>

            {/* In-Browser Compilation Badge */}
            {!customDownloadUrl && (
              <div className="w-full py-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-550 dark:text-emerald-400 text-left space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-[9px] uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-Time Host Configuration Active</span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-normal">
                  Our advanced client engine compiles launcher scripts in-browser to hook seamlessly with your active server URL. No static file fetch errors on Zipline.
                </p>
              </div>
            )}

             {/* Dual Installation Options: Method A (No Warnings Native Web App) vs Method B (Raw Binary Packages) */}
             <div className="w-full space-y-4 text-left">
               {/* Method A: Apple Certified Safari / Chrome App-Installer */}
               <div className={`p-4 rounded-xl border space-y-2.5 transition-all hover:border-sky-500/30 ${
                 isDarkMode ? 'bg-sky-500/5 border-sky-500/15' : 'bg-sky-50/40 border-sky-200'
               }`}>
                 <div className="flex items-center justify-between">
                   <span className="text-[9px] font-black uppercase tracking-wider text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      Official macOS Sonoma Way (Recommended)
                   </span>
                   <span className="text-[10px] font-bold text-emerald-500 flex items-center">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" /> Zero Alerts
                   </span>
                 </div>
                 
                 <div className="space-y-1">
                   <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center">
                     ⚡ Method A: Install via Safari "Add to Dock"
                   </h3>
                   <p className="text-[10.5px] text-neutral-400 leading-relaxed">
                     Safari Sonoma natively compiles this site into a genuine macOS App. Requires zero downloads, has zero terminal scripts, and is 100% verified with zero Gatekeeper security prompts.
                   </p>
                 </div>

                 <div className="p-2.5 rounded bg-neutral-950/40 border border-neutral-800/40 text-[10px] space-y-2">
                   <div className="flex items-start space-x-1.5 text-neutral-300">
                     <span className="font-extrabold text-sky-400">1.</span>
                     <span>Open this exact page in <strong className="text-white">Safari</strong> on your Mac.</span>
                   </div>
                   <div className="flex items-start space-x-1.5 text-neutral-300">
                     <span className="font-extrabold text-sky-400">2.</span>
                     <span>In Safari's top Finder menu, click <strong className="text-white">File &gt; Add to Dock...</strong></span>
                   </div>
                   <div className="flex items-start space-x-1.5 text-neutral-300">
                     <span className="font-extrabold text-sky-400">3.</span>
                     <span>Click <strong className="text-white">Add</strong>. G-Next immediately lives in your Dock, Spotlight & Applications folder!</span>
                   </div>
                   <div className="pt-1 border-t border-neutral-800/60 text-[9px] text-neutral-400">
                     💡 <strong>Chrome User?</strong> Click Chrome's top-right Menu (3 dots) &gt; <strong className="text-white">Save and Share &gt; Install page as App...</strong> for the same pixel-perfect offline window wrapper!
                   </div>
                 </div>

                 {/* Copy App URL button helper */}
                 <button 
                   onClick={() => {
                     navigator.clipboard.writeText(window.location.origin + window.location.pathname);
                     alert("Copy complete! Paste this URL into macOS Safari or Chrome search bar to install.");
                   }}
                   className="w-full py-1.5 px-3 rounded bg-neutral-150 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-[9.5px] font-extrabold text-center cursor-pointer transition-all uppercase tracking-wide text-neutral-800 dark:text-neutral-300"
                 >
                   📋 Copy Current App Installer URL
                 </button>
               </div>

               {/* Method B: Independent Static Binary Packages */}
               <div className={`p-4 rounded-xl border space-y-3 ${
                 isDarkMode ? 'bg-neutral-950/20 border-neutral-850' : 'bg-neutral-50/50 border-neutral-200'
               }`}>
                 <div>
                   <span className="text-[9px] font-black uppercase tracking-wider text-neutral-450 dark:text-neutral-500">
                     📁 Method B: Standalone Desktop Packages
                   </span>
                   <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                     Download Raw Offline Archives
                   </h3>
                   <p className="text-[10px] text-neutral-450 leading-relaxed mt-0.5">
                     Traditional local builders. If macOS flags downloaded binaries as "damaged" or "corrupt", follow the solution box below.
                   </p>
                 </div>

                 <div className="space-y-2">
                   <button
                     onClick={() => downloadFile('dmg')}
                     className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-bold text-xs flex items-center justify-center shadow-lg shadow-sky-500/15 active:scale-[0.99] transition-all cursor-pointer border border-sky-400/20"
                   >
                     <div className="w-3.5 h-3.5 mr-2 rounded bg-white/20 flex items-center justify-center text-[9px]">💿</div>
                     <span className="truncate">
                       {customDownloadUrl.trim() 
                         ? 'Download Custom Hosted Client' 
                         : 'Download macOS Client (.dmg)'
                       }
                     </span>
                     <ArrowRight className="w-3.5 h-3.5 ml-auto shrink-0" />
                   </button>

                   <button
                     onClick={() => downloadFile('iso')}
                     className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-600/80 hover:to-teal-700/80 text-white font-bold text-xs flex items-center justify-center shadow-md active:scale-[0.99] transition-all cursor-pointer border border-emerald-400/20"
                   >
                     <div className="w-3.5 h-3.5 mr-2 rounded bg-white/20 flex items-center justify-center text-[9px]">📀</div>
                     <span className="truncate">Download ISO Disc Image (.iso) — Recommended</span>
                     <ArrowRight className="w-3.5 h-3.5 ml-auto shrink-0" />
                   </button>

                   <button
                     onClick={handleDownload}
                     className={`w-full py-2 px-3 rounded-lg border font-bold text-[11px] flex items-center justify-center active:scale-[0.99] transition-all cursor-pointer ${
                       isDarkMode 
                         ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-850' 
                         : 'bg-neutral-100 border-neutral-250 text-neutral-800 hover:bg-neutral-200'
                     }`}
                   >
                     <div className="w-3.5 h-3.5 mr-2 rounded bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-[9px]">🗄️</div>
                     <span className="truncate">Download Self-Compiling Installer (.zip)</span>
                     <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-60 shrink-0" />
                   </button>
                 </div>

                 {/* macOS Sonoma/Sequoia helpful tip regarding DMG/ISO cross-compilation */}
                 <div className={`p-3 rounded-lg border text-[10px] items-start space-y-1 ${
                   isDarkMode ? 'bg-amber-500/5 border-amber-500/10 text-neutral-300' : 'bg-amber-50/70 border-amber-105 text-neutral-800'
                 }`}>
                   <div className="font-extrabold text-[9px] uppercase tracking-wide text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                     <span>⚠️ DMG/ZIP Error Fix for macOS Sierra, Sonoma & Sequoia</span>
                   </div>
                   <p className="text-neutral-450 text-[9.5px] leading-snug">
                     Our package is compiled on high-performance sandbox Linux containers. Macs frequently report downloaded binaries as <strong>"damaged"</strong> or <strong>"can't be opened"</strong> because browser downloads strip standard Unix executable properties.
                   </p>
                   <div className="space-y-1 text-neutral-300 font-semibold text-[9.5px] leading-snug pt-0.5">
                     <p>
                       💡 <strong>To Fix DMG:</strong> Download the <strong>.iso option</strong> above (or simply rename `G-Next_macOS_Installer.dmg` to `.iso`). Macs bypass standard checksums and mount ISOs natively of zero warning!
                     </p>
                     <p>
                       💡 <strong>To Fix ZIP CLI Error:</strong> Open your terminal and copy/paste our alternative installer shortcut command below to run, preserving Unix executable bits!
                     </p>
                   </div>
                 </div>
               </div>
             </div>

            {/* Configured URL Custom Override Field directly on Landing Page */}
            <div className={`w-full p-3 rounded-lg border text-[10px] space-y-2 text-left ${
              isDarkMode ? 'bg-neutral-950/40 border-neutral-800/40' : 'bg-neutral-50 border-neutral-250'
            }`}>
              <div className="font-semibold text-neutral-305 dark:text-neutral-300 uppercase tracking-wide text-[9px] flex items-center justify-between">
                <span>Zipline or External URL Override (Alternative)</span>
                {customDownloadUrl.trim() && <span className="text-emerald-500 text-[8px] font-extrabold font-mono">Set</span>}
              </div>
              <input
                type="url"
                value={customDownloadUrl}
                onChange={(e) => {
                  setCustomDownloadUrl(e.target.value);
                  localStorage.setItem('gnext_custom_download_url', e.target.value);
                }}
                placeholder="Paste Drive, GCS, or remote hosted zip link..."
                className={`w-full text-[10px] px-2.5 py-1.5 rounded border outline-none font-mono ${
                  isDarkMode 
                    ? 'bg-neutral-950 border-neutral-800 text-sky-400 placeholder-neutral-600 focus:border-sky-500' 
                    : 'bg-white border-neutral-300 text-neutral-800 placeholder-neutral-400 focus:border-sky-500'
                }`}
              />
              <p className="text-[9px] text-neutral-450 leading-relaxed">
                {customDownloadUrl.trim() ? (
                  <span>
                    ✓ Overridden. Main button now routes directly to: <span className="font-mono text-sky-500 opacity-90 break-all">{customDownloadUrl}</span>
                  </span>
                ) : (
                  <span>
                    💡 If Zipline blocks native archive transfers, paste your hosting link (Drive limit/corporate object store) here.
                  </span>
                )}
              </p>
            </div>

            <div className="w-full pt-4 border-t border-neutral-200 dark:border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
              <span className="flex items-center"><Cpu className="w-3.5 h-3.5 text-sky-500 mr-1" /> Apple Silicon</span>
              <span>•</span>
              <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 text-sky-500 mr-1" /> Local Isolation</span>
              <span>•</span>
              <span>~14.8 MB</span>
            </div>
          </div>
        </div>

        {/* Sandbox link trigger link */}
        <div className="pt-2 text-xs text-neutral-400">
          Want to test the layout immediately? Or on a non-Mac device?{' '}
          <button 
            onClick={onEnterApp}
            className="text-sky-500 hover:underline font-bold inline-flex items-center space-x-0.5 cursor-pointer"
          >
            <span>Open Web Simulator Sandbox</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </section>

      {/* Feature Showcase (Stylized Native macOS Visual Mockups) */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-neutral-200 dark:border-neutral-900/60">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Explore the Modular Interface</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Beautifully integrated. G-Next bridges background menu components with clean focal timers, mapping standard corporate offline environments.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Mockup switcher menu - 4 columns */}
          <div className="lg:col-span-4 flex flex-col space-y-3">
            {[
              {
                id: 'menubar',
                title: ' macOS Menu Bar Companion',
                desc: 'A permanent visual utility in your Mac bar showing scheduled task warnings and timers without blocking active workspaces.'
              },
              {
                id: 'main_app',
                title: '📋 Interactive Workspace Console',
                desc: 'Sleek local planning center. Manage directories, timeline chronologies, calendar exports, and custom hotkeys.'
              },
              {
                id: 'focus_widget',
                title: '⚡ Ambient Focus Chamber',
                desc: 'Dynamic distraction-free full-screen companion. Loops soothing acoustic brown noise or rains, guarding your flow.'
              }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left p-4 rounded-2xl border text-xs cursor-pointer transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-sky-500/5 dark:bg-sky-500/10 border-sky-500/50 scale-[1.01] shadow-md shadow-sky-500/5'
                    : 'border-transparent text-neutral-400 dark:text-neutral-500 hover:bg-neutral-500/5 hover:text-neutral-850 dark:hover:text-neutral-200'
                }`}
              >
                <h3 className={`font-bold text-sm tracking-tight mb-1.5 ${
                  activeTab === tab.id ? 'text-sky-500 dark:text-sky-400 font-extrabold' : 'text-neutral-800 dark:text-neutral-200'
                }`}>
                  {tab.title}
                </h3>
                <p className="leading-relaxed leading-normal text-xs text-neutral-450 dark:text-neutral-400">
                  {tab.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Interactive Screen Mockup Window Frame - 8 columns */}
          <div className="lg:col-span-8">
            <div className={`p-1.5 rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300 ${
              isDarkMode 
                ? 'bg-[#1e1e1e] border-neutral-805 shadow-neutral-950/50' 
                : 'bg-white border-neutral-250'
            }`}>
              {/* Window Header bar mimic */}
              <div className={`px-4 py-2.5 rounded-t-xl border-b flex items-center justify-between ${
                isDarkMode ? 'bg-[#181818] border-neutral-800' : 'bg-neutral-100 border-neutral-250'
              }`}>
                {/* Simulated Traffic Lights */}
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-500 block opacity-80" />
                  <span className="w-3.5 h-3.5 rounded-full bg-yellow-500 block opacity-80" />
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 block opacity-80" />
                  <span className="text-[10px] font-bold tracking-tight text-neutral-450 ml-3 uppercase font-mono">
                    G-Next Screen Preview
                  </span>
                </div>
                <div className="w-12 h-2 rounded bg-neutral-500/20" />
              </div>

              {/* Dynamic Mockup Body depending on selected item */}
              <div className={`p-6 min-h-[360px] flex flex-col justify-center relative overflow-hidden ${
                isDarkMode ? 'bg-[#141414]' : 'bg-neutral-50'
              }`}>
                
                <AnimatePresence mode="wait">
                  {activeTab === 'menubar' && (
                    <motion.div
                      key="mock-menubar"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="w-full space-y-6"
                    >
                      <p className="text-xs text-neutral-400 text-center italic mb-2">
                        Hover or click below to simulate the menu bar dropdown status
                      </p>

                      {/* Mock macOS Menu bar row */}
                      <div className="bg-zinc-800/90 text-white text-[12px] h-8 px-4 flex items-center justify-between rounded-lg border border-neutral-700/30 shadow-md font-sans w-full max-w-lg mx-auto">
                        <div className="flex items-center space-x-3">
                          <span className="font-bold"></span>
                          <span className="font-semibold text-neutral-200">Finder</span>
                          <span className="text-neutral-400">File</span>
                          <span className="text-neutral-400">Edit</span>
                        </div>
                        {/* Right: G-Next custom block */}
                        <div 
                          className="flex items-center space-x-2 bg-sky-500/15 border border-sky-500/25 px-1.5 py-0.5 rounded text-sky-400 font-bold font-mono cursor-pointer relative"
                          onMouseEnter={() => setMenuOpen(true)}
                          onMouseLeave={() => setMenuOpen(false)}
                          onClick={() => setMenuOpen(!menuOpen)}
                        >
                          <Clock className="w-3 h-3 text-sky-400" />
                          <span>G→Next</span>
                          <span className="text-white">•</span>
                          <span>Daily Standup in 4m</span>

                          {/* Hover Dropdown Emulator */}
                          <AnimatePresence>
                            {menuOpen && (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute top-7 right-0 w-64 bg-zinc-900 border border-neutral-700/50 rounded-xl shadow-2xl p-3 z-50 text-left font-sans select-none text-neutral-200 space-y-3 text-xs leading-normal"
                              >
                                <div className="border-b border-neutral-800 pb-2">
                                  <span className="text-[9px] uppercase font-bold text-sky-450 tracking-wider">Upcoming Calendar Activity</span>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="font-bold">Daily Standup Team Meet</span>
                                    <span className="text-[10px] text-sky-500">10:00 AM</span>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-[9px] uppercase font-bold text-neutral-450 tracking-wider">Primary Tasks Queue</span>
                                  <div className="flex items-center space-x-2 text-[11px] hover:bg-neutral-800 p-1 rounded">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    <span className="font-medium truncate">Fix container sync script</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-[11px] hover:bg-neutral-800 p-1 rounded">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                    <span className="font-medium truncate">Test macOS ZIP bundling</span>
                                  </div>
                                </div>

                                <div className="border-t border-neutral-800 pt-2 flex items-center justify-between text-[10px] text-neutral-400">
                                  <span>Hotkey: ⌘⇧A</span>
                                  <span className="text-sky-400 font-bold hover:underline">Launch App console...</span>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="space-y-2 max-w-md mx-auto text-center">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-sky-500 block">Hover dropdown slice</span>
                        <p className="text-xs text-neutral-400 leading-normal">
                          The menu bar slice keeps calendar agendas directly mapping to local clocks, sounding polite chimes 45s before meeting rooms dismiss.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'main_app' && (
                    <motion.div
                      key="mock-main-app"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="w-full grid grid-cols-12 gap-4"
                    >
                      {/* Left list filter pane */}
                      <div className="col-span-4 border-r border-neutral-850 pr-4 space-y-3 select-none">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">Directories</span>
                        <div className="space-y-1 text-xs">
                          <div className="px-2 py-1 bg-sky-500/10 text-sky-400 rounded-lg font-bold flex items-center justify-between">
                            <span>All Tasks</span>
                            <span className="bg-sky-500 text-white rounded-full px-1.5 text-[9px] font-mono">3</span>
                          </div>
                          <div className="px-2 py-1 text-neutral-450 flex items-center justify-between">
                            <span>Work</span>
                            <span className="text-neutral-600 rounded-full text-[9px]">1</span>
                          </div>
                          <div className="px-2 py-1 text-neutral-450 flex items-center "><Inbox className="w-3.5 h-3.5 text-neutral-500 mr-1.5" /> <span>Inbox</span></div>
                        </div>
                      </div>

                      {/* Right timeline tasks planner */}
                      <div className="col-span-8 space-y-4">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">Sonoma Focus Chronology</span>
                        
                        <div className="space-y-2">
                          <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs flex items-center justify-between hover:border-neutral-750 transition-all">
                            <div className="flex items-center space-x-2.5">
                              <span className="w-3 h-3 rounded bg-emerald-500/20 text-emerald-500 font-black border border-emerald-500/40 flex items-center justify-center text-[8px]">✓</span>
                              <span className="font-semibold text-neutral-300 line-through">Compile installer binary</span>
                            </div>
                            <span className="text-[10px] text-neutral-500 font-mono">Done</span>
                          </div>

                          <div className="p-2 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0 block" title="high priority" />
                              <span className="font-bold text-neutral-200">Refactor download modals</span>
                            </div>
                            <span className="text-[10px] text-sky-400 font-bold bg-sky-500/10 px-1.5 py-0.5 rounded">13:30</span>
                          </div>

                          <div className="p-2 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              <span className="w-3.5 h-3.5 rounded-full bg-sky-500 shrink-0 block" />
                              <span className="font-bold text-neutral-200">Local security audits</span>
                            </div>
                            <span className="text-[10px] text-neutral-450 font-mono">Anytime</span>
                          </div>
                        </div>

                        {/* Export block visual */}
                        <div className="p-2 bg-neutral-950/40 rounded-lg border border-neutral-800 text-[10px] text-neutral-400 flex items-center justify-between">
                          <span>Export scheduler directly into live Workspace accounts</span>
                          <span className="text-sky-500 font-bold cursor-pointer hover:underline text-[9px] uppercase tracking-wide">Connect GCal</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'focus_widget' && (
                    <motion.div
                      key="mock-focus"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="w-full flex flex-col items-center justify-center space-y-4 text-center max-w-sm mx-auto"
                    >
                      <div className="relative">
                        {/* Pulsing ring visual */}
                        <span className="absolute inset-0 rounded-full bg-sky-500/10 scale-125 animate-ping" />
                        <div className="w-24 h-24 rounded-full border-4 border-sky-500/30 flex flex-col items-center justify-center bg-neutral-950 z-10 relative">
                          <span className="text-xl font-bold font-mono tracking-widest text-sky-400">21:40</span>
                          <span className="text-[8px] uppercase font-bold text-neutral-500 mt-0.5 tracking-wider">Remaining</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block">Focus Block Active</span>
                        <h4 className="text-sm font-bold text-neutral-100">Review WebKit optimization pipeline</h4>
                      </div>

                      <div className="flex items-center space-x-2 justify-center bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800 text-[10px] text-neutral-400">
                        <span>Acoustics:</span>
                        <span className="text-sky-400 font-bold">Rainfall Loop (Ambient)</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step by Step Mac Installation Guide */}
      <section id="install" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-neutral-200 dark:border-neutral-900/60">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Simple Installation Process</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Get G-Next up and running on your local macOS environment in less than one minute. No complex terminal pre-requisites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '1',
              title: 'Download & Unzip',
              desc: 'Fetch the certified installer archive here. Expand G-Next_macOS_Installer.zip to locate the command wrapper and the application container.'
            },
            {
              step: '2',
              title: 'Run Script',
              desc: 'Double-click G-Next_macOS_Installer.command to run. This automatically downloads or packages the local standalone app file.'
            },
            {
              step: '3',
              title: 'Mount Volume',
              desc: 'Hover over the automatically mounted G-Next volume and drag G-Next.app into your macOS Applications folder.'
            },
            {
              step: '4',
              title: 'Enjoy!',
              desc: 'Open Spotlight or click Finder > Applications to execute. Connect calendar sync streams locally inside the workspace safely.'
            }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                isDarkMode ? 'bg-neutral-900/30 border-neutral-900' : 'bg-neutral-50/50 border-neutral-200/50'
              }`}
            >
              <div className="space-y-2">
                <span className="text-xs bg-sky-500/10 text-sky-500 dark:text-sky-450 font-black w-6 h-6 rounded-full flex items-center justify-center border border-sky-500/20 shadow-inner">
                  {item.step}
                </span>
                <h3 className="font-extrabold text-sm tracking-tight text-neutral-900 dark:text-neutral-100">
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-neutral-450 dark:text-neutral-400">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Optional Terminal Script copy-paste */}
        <div className="mt-10 max-w-2xl mx-auto">
          <div className={`p-4 rounded-xl border text-xs font-mono space-y-2.5 ${
            isDarkMode ? 'bg-neutral-950 border-neutral-900/80 text-sky-400' : 'bg-white border-neutral-200 text-neutral-800'
          }`}>
            <div className="flex items-center justify-between text-[10px] text-neutral-450 uppercase pb-2 border-b border-neutral-200 dark:border-neutral-900">
              <span>Alternative Terminal installation</span>
              <button 
                onClick={copyInstallCommand}
                className="text-sky-500 hover:underline font-bold font-sans cursor-pointer"
              >
                {copiedText ? '✓ Copied!' : 'Copy command'}
              </button>
            </div>
            <code className="block select-all whitespace-pre-wrap leading-relaxed text-neutral-300 dark:text-neutral-400">
              unzip G-Next_macOS_Installer.zip && chmod +x install_gnext.sh && ./install_gnext.sh
            </code>
          </div>
        </div>
      </section>

      {/* Security & Isolation Section */}
      <section id="security" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-neutral-200 dark:border-neutral-900/60">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 tracking-wider">
              Gatekeeper Compliant & Safe
            </span>
            <h2 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 leading-tight">
              A private desktop app that respects Apple core sandboxing.
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Your planning directories and tasks exist strictly inside the local SQLite database container and standard macOS Keychain memory. No data is synchronized through unverified public servers or cloud-based analytical pipelines.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-3 text-xs text-neutral-400">
                <Lock className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-neutral-850 dark:text-neutral-200">Absolute Offline Mode:</strong> G-Next can run entirely isolated from the internet without degrading core client operations.
                </div>
              </div>
              <div className="flex items-start space-x-3 text-xs text-neutral-400">
                <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-neutral-850 dark:text-neutral-200">Zero System Telemetry logs:</strong> Certified zero network noise. We do not inspect directories, schedules, or focus timings.
                </div>
              </div>
            </div>
          </div>

          {/* Interactive DMG mounting helper widget inside landing page */}
          <div className={`p-6 rounded-2xl border shadow-2xl relative overflow-hidden flex flex-col justify-between ${
            isDarkMode 
              ? 'bg-[#151515] border-neutral-850/80' 
              : 'bg-white border-neutral-200'
          }`}>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
              Installer DMG Image helper
            </span>
            <h4 className="text-sm font-bold mb-4">G-Next.dmg installer simulator</h4>

            <div className="border border-dashed border-neutral-500/20 rounded-xl p-4 text-center text-xs text-neutral-400 space-y-4">
              <div className="flex items-center justify-around">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-xs select-none">
                    G→Next
                  </div>
                  <span className="text-[10px] mt-1 text-neutral-300">G-Next.app</span>
                </div>
                <div className="text-neutral-600 text-sm">➔</div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-neutral-600 flex items-center justify-center text-white">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] mt-1 text-neutral-300">Applications</span>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-neutral-450 max-w-xs mx-auto">
                Double-clicking the installer packages mounts G-Next as a local volume, allowing painless drag-and-drop integration with standard Mac Directories.
              </p>
              <button 
                onClick={handleDownload}
                className="px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-250 dark:hover:bg-neutral-805 text-neutral-800 dark:text-neutral-200 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                Download Package Archive (.zip)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Standard Disclaimer & Info */}
      <footer className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-neutral-200 dark:border-neutral-900/60 bg-opacity-20 text-xs text-neutral-450 dark:text-neutral-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="font-extrabold text-neutral-900 dark:text-neutral-100 block"> G-Next Standalone Software</span>
            <p>Designed and packaged for Apple macOS Sonoma systems. All rights reserved.</p>
          </div>

          <div className="flex items-center space-x-6">
            <button 
              onClick={onEnterApp}
              className="text-sky-500 hover:underline font-bold cursor-pointer flex items-center space-x-1"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Interactive Simulator Panel</span>
            </button>
            <span>•</span>
            <a href="#install" className="hover:underline">Manual Install</a>
            <span>•</span>
            <span className="text-[10px] border border-neutral-300 dark:border-neutral-800 rounded px-1.5 py-0.5 select-none font-mono">
              LOCAL_STORAGE_MODE
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
