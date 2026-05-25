/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Keyboard, 
  Calendar, 
  Clock, 
  RotateCcw, 
  Sparkles, 
  Key, 
  Edit3, 
  X, 
  AlertTriangle,
  UserCheck,
  Smartphone,
  Check,
  BrainCircuit,
  CloudRain,
  Compass,
  ArrowLeft,
  HelpCircle
} from 'lucide-react';
import { KeyboardShortcut } from '../types';

interface SettingsModalProps {
  shortcuts: KeyboardShortcut[];
  onSaveShortcuts: (newShortcuts: KeyboardShortcut[]) => void;
  onClose: () => void;
  
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  
  googleUser: any;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  
  meetingEndChimeEnabled: boolean;
  setMeetingEndChimeEnabled: (v: boolean) => void;
  
  ambientSound: 'none' | 'brown' | 'binaural' | 'rain';
  setAmbientSound: (v: 'none' | 'brown' | 'binaural' | 'rain') => void;
  
  timerDuration: number;
  setTimerDuration: (v: number) => void;
  
  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  
  onResetOnboarding: () => void;

  colorCategoriesEnabled: boolean;
  setColorEnabledCat?: (v: boolean) => void; // keeping types aligned
  setColorCategoriesEnabled: (v: boolean) => void;
}

type TabType = 'general' | 'sound' | 'calendar' | 'shortcuts';

export default function SettingsModal({
  shortcuts,
  onSaveShortcuts,
  onClose,
  isDarkMode,
  setIsDarkMode,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  soundEnabled,
  setSoundEnabled,
  meetingEndChimeEnabled,
  setMeetingEndChimeEnabled,
  ambientSound,
  setAmbientSound,
  timerDuration,
  setTimerDuration,
  notificationsEnabled,
  setNotificationsEnabled,
  onResetOnboarding,
  colorCategoriesEnabled,
  setColorCategoriesEnabled
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>('general');
  const [activeEditingId, setActiveEditingId] = React.useState<string | null>(null);
  const [localShortcuts, setLocalShortcuts] = React.useState<KeyboardShortcut[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState<boolean>(false);

  React.useEffect(() => {
    setLocalShortcuts(JSON.parse(JSON.stringify(shortcuts)));
  }, [shortcuts]);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        const overtone = audioCtx.createOscillator();
        const overtoneGain = audioCtx.createGain();
        overtone.type = 'sine';
        overtone.frequency.setValueAtTime(freq * 2, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        overtoneGain.gain.setValueAtTime(0, startTime);
        overtoneGain.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
        overtoneGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.5);
        
        osc.connect(gainNode);
        overtone.connect(overtoneGain);
        
        gainNode.connect(audioCtx.destination);
        overtoneGain.connect(audioCtx.destination);
        
        osc.start(startTime);
        overtone.start(startTime);
        
        osc.stop(startTime + duration + 0.1);
        overtone.stop(startTime + duration + 0.1);
      };

      const now = audioCtx.currentTime;
      playTone(698.46, now, 1.2);         // F5
      playTone(880.00, now + 0.15, 1.4);  // A5
      playTone(1046.50, now + 0.3, 1.6);  // C6
    } catch (error) {
      console.warn('Web Audio API blocked or not supported:', error);
    }
  };

  // Global key interceptor when editing a specific hotkey
  React.useEffect(() => {
    if (!activeEditingId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (['Meta', 'Alt', 'Control', 'Shift'].includes(e.key)) {
        return;
      }

      const keyName = e.key.toUpperCase();
      
      setLocalShortcuts(prev => 
        prev.map(sc => {
          if (sc.id === activeEditingId) {
            return {
              ...sc,
              key: keyName === ' ' ? 'SPACE' : keyName,
              metaKey: e.metaKey,
              altKey: e.altKey,
              ctrlKey: e.ctrlKey,
              shiftKey: e.shiftKey
            };
          }
          return sc;
        })
      );
      
      setActiveEditingId(null);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [activeEditingId]);

  const handleResetToDefault = () => {
    const defaults: KeyboardShortcut[] = [
      { id: 'quick-add', name: 'Toggle Quick New Task Picker', key: 'N', ctrlKey: false, metaKey: true, altKey: false, shiftKey: false },
      { id: 'toggle-distraction', name: 'Focus/Distraction-Free Mode', key: 'D', ctrlKey: false, metaKey: true, altKey: false, shiftKey: false },
      { id: 'search', name: 'Focus App Command Search Bar', key: 'K', ctrlKey: false, metaKey: true, altKey: false, shiftKey: false },
      { id: 'trigger-sync', name: 'Trigger Manual Cloud Backup Sync', key: 'S', ctrlKey: false, metaKey: true, altKey: true, shiftKey: false },
      { id: 'toggle-dark', name: 'Toggle Sonoma Color Interface Theme', key: 'L', ctrlKey: false, metaKey: true, altKey: false, shiftKey: false }
    ];
    setLocalShortcuts(defaults);
    setErrorMessage(null);
  };

  const handleSaveShortcuts = () => {
    const keysUsed = new Set<string>();
    let duplicate = false;

    for (const sc of localShortcuts) {
      const uniqueCombo = `${sc.metaKey}-${sc.altKey}-${sc.ctrlKey}-${sc.shiftKey}-${sc.key}`;
      if (keysUsed.has(uniqueCombo)) {
        duplicate = true;
        break;
      }
      keysUsed.add(uniqueCombo);
    }

    if (duplicate) {
      setErrorMessage("Error: Duplicate combinations assigned. Each keyboard shortcut must be unique.");
      return;
    }

    onSaveShortcuts(localShortcuts);
    setErrorMessage(null);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const formatShortcut = (sc: KeyboardShortcut) => {
    const parts: string[] = [];
    if (sc.metaKey) parts.push('⌘ Cmd');
    if (sc.altKey) parts.push('⌥ Option');
    if (sc.ctrlKey) parts.push('⌃ Ctrl');
    if (sc.shiftKey) parts.push('⇧ Shift');
    parts.push(sc.key);
    return parts.join(' + ');
  };

  const renderShortcutKeys = (sc: KeyboardShortcut) => {
    const parts: string[] = [];
    if (sc.metaKey) parts.push('⌘ Cmd');
    if (sc.altKey) parts.push('⌥ Option');
    if (sc.ctrlKey) parts.push('⌃ Ctrl');
    if (sc.shiftKey) parts.push('⇧ Shift');
    parts.push(sc.key);

    return (
      <div className="flex items-center space-x-1 font-mono text-[10.5px]">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-neutral-400 dark:text-neutral-600 font-normal">+</span>}
            <span className="bg-neutral-100 dark:bg-neutral-100 text-black px-1.5 py-0.5 rounded shadow-xs font-normal uppercase tracking-tight text-[10px] border border-neutral-200/40">
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className={`w-full h-full flex flex-col md:flex-row h-[680px] overflow-hidden ${
      isDarkMode 
        ? 'bg-[#161616] text-neutral-100' 
        : 'bg-white text-neutral-850'
    }`}>
      
      {/* Sidebar Navigation - No dividing border */}
      <div className={`w-full md:w-52 p-4 flex flex-col justify-between ${
        isDarkMode ? 'bg-[#161616]' : 'bg-white'
      }`}>
        <div className="space-y-6">
          {/* Sonoma Window Controls */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-rose-500 hover:opacity-80 flex items-center justify-center group"
              title="Close Settings"
            >
              <span className="text-[7px] text-rose-950 font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center">✕</span>
            </button>
            <span className="w-3 h-3 rounded-full bg-[#eab308]/90" />
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>

          {/* Menu Label */}
          <div>
            <button 
              onClick={onClose}
              className="text-neutral-400 dark:text-neutral-500 hover:text-sky-500 transition-all cursor-pointer flex items-center space-x-1.5 focus:outline-none w-fit mb-2"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Settings</span>
            </button>
            <div className="space-y-1.5 mt-2.5">
              {[
                { id: 'general', name: 'General & Timers', icon: <Clock className="w-4 h-4" /> },
                { id: 'sound', name: 'Sound & Acoustics', icon: <Volume2 className="w-4 h-4" /> },
                { id: 'calendar', name: 'Google Account', icon: <Calendar className="w-4 h-4" /> },
                { id: 'shortcuts', name: 'Hotkeys Shortcuts', icon: <Keyboard className="w-4 h-4" /> }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as TabType)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all duration-150 border ${
                    activeTab === t.id
                      ? 'bg-sky-500/15 border-sky-500/45 text-sky-400 font-extrabold'
                      : 'border-transparent hover:bg-neutral-500/10 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {t.icon}
                    <span>{t.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Exit Button - Styled beautifully with colorful blue icon */}
        <div className="p-1">
          <button
            onClick={onClose}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border border-neutral-500/10 cursor-pointer transition-all duration-150 ${
              isDarkMode 
                ? 'bg-neutral-900/65 hover:bg-neutral-800/80 text-neutral-350' 
                : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <ArrowLeft className="w-4 h-4 text-sky-500 shrink-0" />
              <span>Exit Settings</span>
            </div>
          </button>
        </div>
      </div>
      
      {/* Content Pane */}
      <div className="grow flex-1 flex flex-col justify-between overflow-y-auto">
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Tab 1: General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6 text-left">
              <div>
                <h3 className="text-lg font-bold">General Settings</h3>
                <p className="text-xs text-neutral-400 mt-1">Configure workspace defaults and theme configuration.</p>
              </div>

              {/* Dark Mode Theme Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block font-sans">
                  Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setIsDarkMode(true);
                      localStorage.setItem('upnext_theme', 'dark');
                    }}
                    className={`p-3.5 rounded-xl flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all border ${
                      isDarkMode 
                        ? 'border-sky-500 bg-sky-500/15 font-extrabold text-sky-400 shadow-sm' 
                        : 'border-neutral-200 bg-neutral-100/40 hover:bg-neutral-150/60 text-neutral-400'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#181818] border border-neutral-700 transition-all placeholder-style-swatch" />
                    <span className="text-xs font-mono font-normal">Cosmic Dark Theme</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDarkMode(false);
                      localStorage.setItem('upnext_theme', 'light');
                    }}
                    className={`p-3.5 rounded-xl flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all border ${
                      !isDarkMode 
                        ? 'border-sky-500 bg-sky-500/15 font-extrabold text-sky-500 shadow-sm' 
                        : 'border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/60 text-neutral-400'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-300 transition-all placeholder-style-swatch" />
                    <span className="text-xs font-mono font-normal">Modern Light Theme</span>
                  </button>
                </div>
              </div>

              {/* Focus Timer Standard Presets */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                  Default Work Session Duration
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={timerDuration}
                    onChange={(e) => setTimerDuration(parseInt(e.target.value, 10) || 25)}
                    className={`w-20 px-3 py-1.5 text-xs text-center font-mono rounded-lg border outline-none font-normal ${
                      isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-800'
                    }`}
                    min="1"
                    max="300"
                  />
                  <span className="text-xs text-neutral-400">minutes per loop block</span>
                </div>
              </div>

              {/* Category Color Tweak Option */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                isDarkMode ? 'border-neutral-800 bg-neutral-900/40' : 'border-neutral-200 bg-neutral-100/40'
              }`}>
                <div className="space-y-0.5 text-left pr-8 flex-1 min-w-0">
                  <span className="text-xs font-bold block">Color-Theme Category Lists</span>
                  <span className="text-[10px] text-neutral-400 leading-relaxed block">
                    Display category list icons and bullet indicators with custom Sonoma theme colors in the sidebar. Off by default.
                  </span>
                </div>
                <button
                  onClick={() => setColorCategoriesEnabled(!colorCategoriesEnabled)}
                  className={`w-10 h-6 rounded-full transition-all flex items-center cursor-pointer px-1 relative shrink-0 ${
                    colorCategoriesEnabled ? 'bg-sky-500 justify-end' : 'bg-neutral-700/80 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                </button>
              </div>

              {/* Re-run Onboarding button - No divider, generous padding below */}
              <div className="pt-4 flex flex-col items-start pb-12">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                  Setup Wizards & Launch Diagnostics
                </span>
                <span className="text-xs text-neutral-400">
                  Restart and replay system welcome tour.
                </span>
                <button
                  onClick={onResetOnboarding}
                  className="mt-4 px-3.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 hover:text-sky-600 font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer self-start"
                >
                  Reset & Run Onboarding
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Sound & Acoustics */}
          {activeTab === 'sound' && (
            <div className="space-y-5 text-left">
              <div>
                <h3 className="text-lg font-bold">Sound & Acoustic Settings</h3>
                <p className="text-xs text-neutral-400 mt-1">Configure spatial feedback and background noises.</p>
              </div>

              {/* Alarm Toggles */}
              <div className="grid grid-cols-1 gap-2">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isDarkMode ? 'border-neutral-800 bg-neutral-900/40' : 'border-neutral-200 bg-neutral-100/40'
                }`}>
                  <div className="space-y-0.5 text-left pr-8 max-w-[280px] xs:max-w-xs sm:max-w-sm flex-1 min-w-0">
                    <span className="text-xs font-bold block">Chime Alarms Active</span>
                    <span className="text-[10px] text-neutral-400 leading-relaxed block">
                      Sound a brief, high-contrast F-major chime precisely when your calendar meetings are starting and workspace focal timers expire.
                    </span>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-10 h-6 rounded-full transition-all flex items-center cursor-pointer px-1 relative ${
                      soundEnabled ? 'bg-sky-500 justify-end' : 'bg-neutral-700/80 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                  </button>
                </div>

                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isDarkMode ? 'border-neutral-800 bg-neutral-900/40' : 'border-neutral-200 bg-neutral-100/40'
                }`}>
                  <div className="space-y-0.5 text-left pr-8 max-w-[285px] xs:max-w-xs sm:max-w-sm flex-1 min-w-0">
                    <span className="text-xs font-bold block">Meeting End Alarm Chime</span>
                    <span className="text-[10px] text-neutral-400 leading-relaxed block">
                      Play a dual-tone harmonic warning chime precisely when synchronized meetings are meant to conclude.
                    </span>
                  </div>
                  <button
                    onClick={() => setMeetingEndChimeEnabled(!meetingEndChimeEnabled)}
                    className={`w-10 h-6 rounded-full transition-all flex items-center cursor-pointer px-1 relative ${
                      meetingEndChimeEnabled ? 'bg-sky-500 justify-end' : 'bg-neutral-700/80 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                  </button>
                </div>
              </div>

                {/* Ambient Sound Defaults selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                    Default Background Loop Ambient Sound
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'none', label: 'Silent Focus', desc: 'Absolute quiet text mode', icon: <VolumeX className="w-4 h-4" /> },
                      { id: 'brown', label: 'Deep Brown Space', desc: 'Lower atmospheric cozy rumbles', icon: <Compass className="w-4 h-4" /> },
                      { id: 'binaural', label: '40Hz Binaural Beats', desc: 'Theta cognitive frequency targets', icon: <BrainCircuit className="w-4 h-4" /> },
                      { id: 'rain', label: 'Atmospheric Rain', desc: 'Soft clicking drop water waves', icon: <CloudRain className="w-4 h-4" /> }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setAmbientSound(item.id as any)}
                        className={`p-3 rounded-xl border text-left flex items-start space-x-2.5 cursor-pointer transition-all ${
                          ambientSound === item.id
                            ? 'border-sky-500 bg-sky-500/15 text-sky-400 font-extrabold'
                            : isDarkMode ? 'border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/60 text-neutral-400' : 'border-neutral-200 bg-neutral-100/40 hover:bg-neutral-150/60 text-neutral-650'
                        }`}
                      >
                        <span className="mt-0.5 shrink-0 text-sky-500">{item.icon}</span>
                        <div>
                          <h4 className="text-xs font-normal font-mono">{item.label}</h4>
                          <p className="text-[9px] text-neutral-400 leading-tight mt-0.5">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sonoma Notification toggle */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isDarkMode ? 'border-neutral-800 bg-neutral-900/40' : 'border-neutral-200 bg-neutral-100/40'
                }`}>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block">App Live Toast Notifications</span>
                    <span className="text-[10px] text-neutral-400 leading-relaxed block max-w-sm">
                      Toggle whether desktop-style Sonoma meeting reminder slide-over cards are rendered in top corners.
                    </span>
                  </div>
                  <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`w-10 h-6 rounded-full transition-all flex items-center cursor-pointer px-1 relative ${
                      notificationsEnabled ? 'bg-sky-500 justify-end' : 'bg-neutral-700/80 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                  </button>
                </div>

                {/* Test Chime diagnostic widget */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isDarkMode ? 'border-neutral-800 bg-neutral-900/40 font-medium' : 'border-neutral-200 bg-neutral-100/40'
                }`}>
                  <div className="space-y-0.5 text-left">
                    <span className={`text-xs font-bold block flex items-center gap-1.5 ${isDarkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse shrink-0" />
                      <span>Diagnostic Acoustics</span>
                    </span>
                    <span className="text-[10px] text-neutral-400 leading-normal block max-w-xs">
                      Audition the corporate arpeggiated melodic sound effect.
                    </span>
                  </div>
                  <button
                    onClick={playChime}
                    className="text-white hover:bg-sky-600 bg-sky-500 transition-all cursor-pointer font-bold py-1.5 px-3 rounded-lg text-xs duration-150 inline-flex items-center gap-1 shrink-0"
                  >
                    Test Chime
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Google Account Profile settings */}
            {activeTab === 'calendar' && (
              <div className="space-y-6 text-left">
                <div>
                  <h3 className="text-lg font-bold">Google Calendar Account Auth</h3>
                  <p className="text-xs text-neutral-400 mt-1">Conenct profiles and map real-time timelines.</p>
                </div>

                <div className={`p-6 rounded-xl border min-h-[320px] flex flex-col items-center justify-center space-y-4 text-center ${
                  isDarkMode ? 'border-neutral-800 bg-neutral-900/40' : 'border-neutral-200 bg-neutral-100/40'
                }`}>
                  {googleUser ? (
                    <div className="space-y-4 text-center pb-2">
                      <div className="flex items-center space-x-3 bg-emerald-500/10 text-emerald-500 text-xs font-bold px-3 py-2 rounded-lg self-center mx-auto inline-flex">
                        <UserCheck className="w-4 h-4" />
                        <span>Google Account Connected: {googleUser.email}</span>
                      </div>
                      
                      <div className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                        Your real-time meetings timeline is being synchronized perfectly. Chimes are scheduled to sound exactly when your events are launching.
                      </div>

                      <div className="flex items-center justify-center space-x-3 pt-2">
                        <button
                          onClick={onGoogleSignIn}
                          className="px-3 py-2 bg-sky-500 text-white font-bold text-xs rounded-lg cursor-pointer hover:bg-sky-600 transition-all"
                        >
                          Connect Another Google Account
                        </button>
                        <button
                          onClick={onGoogleSignOut}
                          className="px-3 py-2 text-xs font-bold text-neutral-400 hover:text-rose-500 cursor-pointer transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 flex flex-col justify-center items-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-neutral-500/10 flex items-center justify-center mx-auto border border-neutral-500/10">
                        <Calendar className="w-6 h-6 text-neutral-400" />
                      </div>
                      
                      <div className="max-w-xs mx-auto space-y-1">
                        <h4 className="text-xs font-bold">No Account Active</h4>
                        <p className="text-[10px] text-neutral-400 leading-relaxed">
                          Link Google Calendar to sync real meeting parameters, sound alarms, and map agendas.
                        </p>
                      </div>

                      <button
                        onClick={onGoogleSignIn}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-lg inline-flex items-center space-x-1.5 cursor-pointer shadow-none transition-transform active:scale-95"
                      >
                        <span>Connect Google Calendar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 4: Shortcuts customization tool */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-4 text-left">
                <div>
                  <h3 className="text-lg font-bold">Keyboard Hotkeys Shortcuts</h3>
                  <p className="text-xs text-neutral-400 mt-1">Bind custom keys to instantly run actions. Click custom modifier to trigger listen mode.</p>
                </div>

                {errorMessage && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg text-xs text-rose-500 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-2">
                  {localShortcuts.map((sc) => {
                    const isEditingThis = activeEditingId === sc.id;
                    return (
                      <div 
                        key={sc.id}
                        className={`p-2.5 rounded-lg border flex items-center justify-between transition-all text-xs ${
                          isEditingThis 
                            ? 'border-sky-500 bg-sky-500/15 font-semibold text-sky-400' 
                            : isDarkMode ? 'border-neutral-800 bg-neutral-900/40' : 'border-neutral-200 bg-neutral-100/40'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">{sc.name}</span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {isEditingThis ? (
                            <span className="text-[10px] font-mono text-sky-500 bg-sky-500/10 border border-sky-500/20 px-2 py-1 rounded animate-pulse">
                              Listening...
                            </span>
                          ) : (
                            renderShortcutKeys(sc)
                          )}

                          <button
                            onClick={() => setActiveEditingId(isEditingThis ? null : sc.id)}
                            className={`p-1 mt-0.5 rounded cursor-pointer transition-colors ${
                              isEditingThis ? 'bg-rose-500/20 text-rose-500' : 'hover:bg-neutral-500/15 text-neutral-400'
                            }`}
                          >
                            {isEditingThis ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    onClick={handleResetToDefault}
                    className="px-3.5 py-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-[11px] rounded-lg cursor-pointer transition-all duration-150 flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Original Keys</span>
                  </button>
                  <div className="flex items-center space-x-3 text-right">
                    {saveSuccess && (
                      <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded">
                        ✓ Shortcuts Synced
                      </span>
                    )}
                    <button
                      onClick={handleSaveShortcuts}
                      className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-[11px] rounded-lg cursor-pointer duration-150"
                    >
                      Apply New Keys
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    );
  }
