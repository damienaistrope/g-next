import React from 'react';
import { ArrowLeft, HelpCircle, Sparkles } from 'lucide-react';

interface HelpAndAboutViewProps {
  onClose: () => void;
  isDarkMode: boolean;
}

export default function HelpAndAboutView({ onClose, isDarkMode }: HelpAndAboutViewProps) {
  return (
    <div className={`w-full h-full flex flex-col md:flex-row h-[680px] overflow-hidden ${
      isDarkMode 
        ? 'bg-[#161616] text-neutral-100' 
        : 'bg-white text-neutral-850'
    }`} id="help-about-container">
      
      {/* Sidebar Navigation - Left side */}
      <div className={`w-full md:w-52 p-4 flex flex-col justify-between ${
        isDarkMode ? 'bg-[#161616]' : 'bg-white'
      }`} id="help-sidebar">
        <div className="space-y-6">
          {/* Sonoma Window Controls */}
          <div className="flex items-center space-x-2" id="help-window-controls">
            <button 
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-rose-500 hover:opacity-80 flex items-center justify-center group"
              title="Close Help & About"
              id="help-close-dot"
            >
              <span className="text-[7px] text-rose-950 font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center">✕</span>
            </button>
            <span className="w-3 h-3 rounded-full bg-[#eab308]/90" />
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>

          {/* Menu Label / Back control */}
          <div id="help-menu-brand">
            <button 
              onClick={onClose}
              className="text-neutral-400 dark:text-neutral-500 hover:text-sky-500 transition-all cursor-pointer flex items-center space-x-1.5 focus:outline-none w-fit mb-2"
              id="help-back-btn"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Back to App</span>
            </button>
            
            <div className="space-y-1.5 mt-4">
              <div 
                className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border bg-sky-500/15 border-sky-500/45 text-sky-400 font-extrabold"
                id="help-active-tab-btn"
              >
                <div className="flex items-center space-x-2.5">
                  <HelpCircle className="w-4 h-4 text-sky-400" />
                  <span>Help & About</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exit Button at bottom of sidebar */}
        <div className="p-1" id="help-sidebar-bottom-exit">
          <button
            onClick={onClose}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border cursor-pointer transition-all duration-150 ${
              isDarkMode 
                ? 'border-neutral-800 text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-200' 
                : 'border-neutral-200 text-neutral-500 hover:bg-neutral-500/10 hover:text-neutral-800'
            }`}
            id="help-dismiss-btn"
          >
            <div className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4 text-sky-500 shrink-0" />
              <span>Exit Help & About</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main content pane */}
      <div className={`grow flex-1 p-6 md:p-8 overflow-y-auto ${
        isDarkMode ? 'bg-[#161616]' : 'bg-white'
      }`} id="help-content-pane">
        <div className="space-y-6 text-left max-w-xl mx-auto md:mx-0">
          <div>
            <h3 className="text-lg font-bold">Help & About</h3>
            <p className="text-xs text-neutral-400 mt-1">Product metadata, credentials, and offline usage guidebook.</p>
          </div>

          {/* About Section with Damien's attribution */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDarkMode ? 'border-neutral-800 bg-neutral-900/40' : 'border-neutral-200 bg-neutral-100/40'
          }`} id="about-card">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-4.5 h-4.5 text-sky-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-sky-500">Design Team Identity</span>
            </div>
            <div className="space-y-1.5">
              <p className={`text-xs ${isDarkMode ? 'text-neutral-200' : 'text-neutral-700'}`}>
                UpNext was envisioned and primary-coded as an ambient, calendar-syncing focus sandbox.
              </p>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans mt-2 pt-2 border-t border-neutral-500/10">
                Created by <strong className={isDarkMode ? 'text-white' : 'text-neutral-900'}>Damien Aistrope</strong>, Staff Interaction Designer on Material Design.
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                To share design feedback, coordinate visual suggestions, or request immediate support, feel free to reach out directly at:
              </p>
              <a
                href="mailto:aistrope@google.com"
                className="inline-block mt-1 text-xs font-semibold text-sky-500 hover:underline hover:text-sky-400 transition-colors"
                id="contact-email-link"
              >
                aistrope@google.com
              </a>
            </div>
          </div>

          {/* FAQ Quick Start Guide */}
          <div className="space-y-3.5" id="guidebook-section">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Acoustic Usage Guide</h4>
            <div className="space-y-3 text-xs leading-relaxed font-sans">
              <div className="space-y-0.5">
                <p className={`font-bold ${isDarkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>1. Instigating Focus Loops</p>
                <p className="text-neutral-500 dark:text-neutral-400">Click folders in your custom lists list or insert a specific text goal within the immediate input. Toggle the countdown trigger in-chamber to enable ambient auditory generators.</p>
              </div>
              <div className="space-y-0.5">
                <p className={`font-bold ${isDarkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>2. Multi-Device Hotkeys binding</p>
                <p className="text-neutral-500 dark:text-neutral-400">Apply custom keyboard overrides under the Hotkeys customization panel. Press combinations on physical keys to instantly toggle active windows without cursor engagement.</p>
              </div>
              <div className="space-y-0.5">
                <p className={`font-bold ${isDarkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>3. Offline Security Safeguards</p>
                <p className="text-neutral-500 dark:text-neutral-400">Your folders, categories, custom lists, and focus histories are stored with absolute local storage integrity on your host browser client. Nothing is sent to public telemetry boards.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
