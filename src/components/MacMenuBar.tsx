/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Command, 
  Wifi, 
  Battery, 
  CloudLightning, 
  CloudOff,
  Cloud, 
  Zap, 
  Settings,
  Download,
  Clock,
  Video,
  ExternalLink,
  Power,
  Sparkles
} from 'lucide-react';
import { CloudSyncState, CalendarEvent } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface MacMenuBarProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  syncState: CloudSyncState;
  triggerSync: () => void;
  onOpenShortcuts: () => void;
  onOpenDmgMode: () => void;
  activeWindow: 'app' | 'distraction' | 'dmg' | 'settings' | 'help';
  setActiveWindow: (win: 'app' | 'distraction' | 'dmg' | 'settings' | 'help') => void;
  currentFocusTaskName?: string;
  calendarEvents: CalendarEvent[];
  onExitSimulator?: () => void;
}

export default function MacMenuBar({
  isDarkMode,
  setIsDarkMode,
  syncState,
  triggerSync,
  onOpenShortcuts,
  onOpenDmgMode,
  activeWindow,
  setActiveWindow,
  currentFocusTaskName,
  calendarEvents = [],
  onExitSimulator
}: MacMenuBarProps) {
  const [timeStr, setTimeStr] = React.useState<string>('23:51');
  const [dateStr, setDateStr] = React.useState<string>('Sat May 23');
  const [isMeetingDropdownOpen, setIsMeetingDropdownOpen] = React.useState<boolean>(false);
  const [isAppleMenuOpen, setIsAppleMenuOpen] = React.useState<boolean>(false);
  const [showQuitConfirm, setShowQuitConfirm] = React.useState<boolean>(false);
  const [isQuitted, setIsQuitted] = React.useState<boolean>(false);
  const [virtualTime, setVirtualTime] = React.useState<Date>(new Date('2026-05-23T23:51:21Z'));
  
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);
  const appleMenuRef = React.useRef<HTMLDivElement | null>(null);
  const chimedEventsRef = React.useRef<Record<string, boolean>>({});
  const [meetingNotification, setMeetingNotification] = React.useState<{ title: string; location?: string; id: string } | null>(null);

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
      // Arpeggiated F-major chime with clear overtones
      playTone(698.46, now, 1.2);         // F5
      playTone(880.00, now + 0.15, 1.4);  // A5
      playTone(1046.50, now + 0.3, 1.6);  // C6
    } catch (error) {
      console.warn('Web Audio API blocked or not supported:', error);
    }
  };

  React.useEffect(() => {
    if (!calendarEvents || calendarEvents.length === 0) return;
    const nowTime = virtualTime.getTime();
    
    calendarEvents.forEach(event => {
      const eventTime = new Date(event.startTime).getTime();
      // Sound chime and banner exactly when matching event start (within 10-second boundary)
      if (nowTime >= eventTime && nowTime <= eventTime + 10000) {
        if (!chimedEventsRef.current[event.id]) {
          chimedEventsRef.current[event.id] = true;
          playChime();
          setMeetingNotification({
            id: event.id,
            title: event.title,
            location: event.location
          });
          
          setTimeout(() => {
            setMeetingNotification(prev => prev && prev.id === event.id ? null : prev);
          }, 10000);
        }
      }
    });
  }, [virtualTime, calendarEvents]);

  React.useEffect(() => {
    // Current local time: 2026-05-23T23:51:21Z
    const baseTime = new Date('2026-05-23T23:51:21Z');
    let elapsedMs = 0;
    
    const interval = setInterval(() => {
      elapsedMs += 1000;
      const current = new Date(baseTime.getTime() + elapsedMs);
      setVirtualTime(current);
      
      const hours = current.getUTCHours().toString().padStart(2, '0');
      const mins = current.getUTCMinutes().toString().padStart(2, '0');
      setTimeStr(`${hours}:${mins}`);
      
      const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' };
      setDateStr(current.toLocaleDateString('en-US', options));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside clicks
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsMeetingDropdownOpen(false);
      }
      if (appleMenuRef.current && !appleMenuRef.current.contains(e.target as Node)) {
        setIsAppleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getSyncIcon = () => {
    switch (syncState.status) {
      case 'syncing':
        return <Cloud className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 animate-pulse animate-spin" />;
      case 'error':
        return <CloudLightning className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-500" title="Sync issue" />;
      case 'offline':
        return <CloudOff className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" title="Offline mode" />;
      case 'synced':
      default:
        return <Cloud className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" title="Workspace synced" />;
    }
  };

  // Extract a Google Meet link from an event's location or notes
  const getGoogleMeetLink = (event: CalendarEvent): string => {
    if (event.location && event.location.includes('meet.google.com')) {
      const match = event.location.match(/meet\.google\.com\/[a-z0-9-]+/i);
      if (match) return `https://${match[0]}`;
    }
    if (event.notes && event.notes.includes('meet.google.com')) {
      const match = event.notes.match(/meet\.google\.com\/[a-z0-9-]+/i);
      if (match) return `https://${match[0]}`;
    }
    const slug = event.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 10);
    return `https://meet.google.com/gnt-${slug || 'sync'}`;
  };

  // Dynamic Meeting Time Countdown / Tracking logic
  const getUpcomingMeetInfo = () => {
    if (!calendarEvents || calendarEvents.length === 0) return null;
    
    const nowTime = virtualTime.getTime();
    
    // Sort events by start date
    const sorted = [...calendarEvents].sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
    
    // Check if there is an active meeting currently ongoing
    const ongoing = sorted.find(e => {
      const start = new Date(e.startTime).getTime();
      const end = new Date(e.endTime).getTime();
      return nowTime >= start && nowTime <= end;
    });
    
    if (ongoing) {
      const end = new Date(ongoing.endTime).getTime();
      const remMin = Math.ceil((end - nowTime) / 60000);
      return {
        event: ongoing,
        label: `Active: ${ongoing.title} (${remMin}m left)`,
        isOngoing: true
      };
    }
    
    // Check closest upcoming meeting within same day or future
    const upcoming = sorted.find(e => {
      const start = new Date(e.startTime).getTime();
      return start > nowTime;
    });
    
    if (upcoming) {
      const start = new Date(upcoming.startTime).getTime();
      const diffMs = start - nowTime;
      const hours = Math.floor(diffMs / 3600000);
      const mins = Math.ceil((diffMs % 3600000) / 60000);
      
      let countdownLabel = '';
      if (hours > 0) {
        countdownLabel = `${hours}h ${mins}m`;
      } else {
        countdownLabel = `${mins}m`;
      }
      
      return {
        event: upcoming,
        label: `${upcoming.title} in ${countdownLabel}`,
        isOngoing: false
      };
    }
    
    return null;
  };

  const upcomingMeetInfo = getUpcomingMeetInfo();

  return (
    <>
      {/* macOS Sonoma style Interactive Glassmorphic Notification Toast */}
      <AnimatePresence>
        {meetingNotification && (
          <motion.div
            initial={{ opacity: 0, x: 360, y: 0, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 360, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className={`fixed top-14 right-4 w-[340px] rounded-2xl p-3.5 shadow-2xl z-[99999] text-left backdrop-blur-3xl flex items-start space-x-3.5 ${
              isDarkMode 
                ? 'bg-[#1e1e1e]/90 text-neutral-200' 
                : 'bg-white/95 text-neutral-800 shadow-neutral-300'
            }`}
          >
            {/* macOS App Icon on left */}
            <div className="shrink-0">
              <div className="w-11 h-11 rounded-xl bg-sky-600 flex items-center justify-center text-white font-bold text-xs border border-white/10">
                <span className="tracking-tighter font-extrabold text-[13px]">G→N</span>
              </div>
            </div>

            {/* Notification content body */}
            <div className="grow flex-1 min-w-0 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  G-Next Workspace
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">
                  now
                </span>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-xs font-bold leading-tight">
                  Next Meeting is Starting
                </h4>
                <p className="text-xs text-sky-500 font-bold leading-normal truncate">
                  {meetingNotification.title}
                </p>
                {meetingNotification.location && (
                  <p className="text-[10px] bg-violet-500/10 text-violet-500 font-bold tracking-tight px-2 py-1 rounded inline-flex items-center gap-1.5 self-start mt-1">
                    <span>📍</span>
                    <span>Room: {meetingNotification.location}</span>
                  </p>
                )}
              </div>

              {/* Action buttons styled exactly like macOS translucent options */}
              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={() => setMeetingNotification(null)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center border transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'border-neutral-800 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300' 
                      : 'border-neutral-200 bg-neutral-100 hover:bg-neutral-150 text-neutral-700'
                  }`}
                >
                  Dismiss
                </button>
                <a
                  href={`https://meet.google.com/gnt-${meetingNotification.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 10)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMeetingNotification(null)}
                  className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] rounded-lg text-center flex items-center justify-center transition-all cursor-pointer shadow-sm shadow-emerald-500/10"
                >
                  Join
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`w-full h-11 px-4 flex items-center justify-between text-xs font-sans tracking-tight border-b select-none z-50 transition-colors duration-305 backdrop-blur-md relative ${
        isDarkMode 
          ? 'bg-neutral-900/75 border-neutral-800/60 text-neutral-200' 
          : 'bg-white/75 border-neutral-200/60 text-neutral-800'
      }`}>
        {/* Left items (Interactive native G→Next status app settings dropdown) */}
        <div className="flex items-center space-x-3">
          <div className="relative" ref={appleMenuRef}>
            <button 
              onClick={() => setIsAppleMenuOpen(prev => !prev)}
              className={`flex items-center space-x-1 cursor-pointer font-bold duration-150 active:scale-95 focus:outline-none py-1 px-2.5 rounded-lg transition-all text-[11px] ${
                isAppleMenuOpen
                  ? 'bg-sky-500/10 text-sky-500 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-500/10 hover:text-neutral-800 dark:hover:text-neutral-100'
              }`}
              title="G→Next Workspace Controller"
            >
              <span className="font-extrabold tracking-tight">G→Next</span>
            </button>

            {/* Apple Sonoma style Dropdown */}
            <AnimatePresence>
              {isAppleMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 2, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  className={`absolute left-0 top-full mt-1 w-60 rounded-xl shadow-2xl backdrop-blur-2xl overflow-hidden text-left z-50 p-1.5 ${
                    isDarkMode 
                      ? 'bg-neutral-900/95 text-neutral-200' 
                      : 'bg-white/95 text-neutral-800 shadow-neutral-300/40'
                  }`}
                >
                  {onExitSimulator && (
                    <button
                      onClick={() => {
                        setIsAppleMenuOpen(false);
                        onExitSimulator();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-sky-500 hover:bg-sky-500 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center justify-between font-bold"
                    >
                      <span>← Exit Simulator (Exit to Landing)</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsAppleMenuOpen(false);
                      onOpenDmgMode();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-sky-500 hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span>About G→Next</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsAppleMenuOpen(false);
                      setActiveWindow('app');
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-sky-500 hover:text-white transition-colors cursor-pointer flex items-center justify-between ${
                      activeWindow === 'app' ? 'text-sky-500 bg-sky-500/5 font-bold' : ''
                    }`}
                  >
                    <span>Open Desktop</span>
                    <span className="text-[10px] opacity-60 font-mono font-normal">⌘D</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsAppleMenuOpen(false);
                      setActiveWindow('distraction');
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-sky-500 hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span>Activate Focus Chamber</span>
                    <span className="text-[10px] opacity-60 font-mono font-normal">⌘F</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsAppleMenuOpen(false);
                      setActiveWindow('app');
                      setTimeout(() => {
                        onOpenShortcuts();
                      }, 100);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-sky-500 hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span>Settings</span>
                    <span className="text-[10px] opacity-60 font-mono font-normal">⌘,</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsAppleMenuOpen(false);
                      triggerSync();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-sky-500 hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span>Force Sync</span>
                    <span className="text-[10px] opacity-60 font-mono font-normal">⌥⌘S</span>
                  </button>

                  <div className="my-1 h-px bg-neutral-500/10" />

                  <button
                    onClick={() => {
                      setIsAppleMenuOpen(false);
                      setShowQuitConfirm(true);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center justify-between font-bold"
                  >
                    <span>Quit</span>
                    <span className="text-[10px] opacity-60 font-mono font-normal">⌘Q</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span className="opacity-20 text-neutral-400">|</span>

          <button 
            onClick={() => setActiveWindow('app')}
            className={`cursor-pointer transition-all duration-150 py-1 px-2.5 rounded-xl text-[11px] border ${
              activeWindow === 'app' 
                ? 'bg-sky-500/10 border-sky-500/35 text-sky-400 font-extrabold' 
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-800 dark:hover:text-neutral-200 font-semibold'
            }`}
          >
            Desktop App
          </button>

          <button 
            onClick={() => setActiveWindow('distraction')}
            className={`cursor-pointer transition-all duration-150 py-1 px-2.5 rounded-xl text-[11px] border ${
              activeWindow === 'distraction' 
                ? 'bg-sky-500/10 border-sky-500/35 text-sky-400 font-extrabold' 
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-800 dark:hover:text-neutral-200 font-semibold'
            }`}
          >
            Focus Chamber
          </button>

          <button 
            onClick={() => setActiveWindow('help')}
            className={`cursor-pointer transition-all duration-150 py-1 px-2.5 rounded-xl text-[11px] border ${
              activeWindow === 'help' 
                ? 'bg-sky-500/10 border-sky-500/35 text-sky-400 font-extrabold' 
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-800 dark:hover:text-neutral-200 font-semibold'
            }`}
          >
            Help & About
          </button>

          <button 
            onClick={() => setActiveWindow('settings')}
            className={`cursor-pointer transition-all duration-150 py-1 px-2.5 rounded-xl text-[11px] border ${
              activeWindow === 'settings' 
                ? 'bg-sky-500/10 border-sky-500/35 text-sky-400 font-extrabold' 
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-800 dark:hover:text-neutral-200 font-semibold'
            }`}
          >
            Settings
          </button>

          <button 
            onClick={onOpenDmgMode}
            className={`cursor-pointer transition-all duration-150 py-1 px-2.5 rounded-xl text-[11px] border ${
              activeWindow === 'dmg' 
                ? 'bg-sky-500/10 border-sky-500/35 text-sky-400 font-extrabold' 
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-800 dark:hover:text-neutral-200 font-semibold'
            }`}
          >
            macOS DMG
          </button>
        </div>

        {/* Center Focused Indicator if in progress */}
        {currentFocusTaskName && activeWindow !== 'distraction' && (
          <div 
            onClick={() => setActiveWindow('distraction')}
            className="hidden md:flex items-center space-x-2 bg-neutral-100 dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 px-3 py-1 rounded-full cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all duration-200"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-450 dark:bg-neutral-500 animate-pulse" />
            <span className="text-[11px] text-neutral-700 dark:text-neutral-300 font-semibold">
              Active: {currentFocusTaskName.length > 25 ? `${currentFocusTaskName.slice(0, 25)}...` : currentFocusTaskName}
            </span>
          </div>
        )}

        {/* Right items */}
        <div className="flex items-center space-x-4">
          
          {/* Interactive Live Meetings Countdown widget dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsMeetingDropdownOpen(prev => !prev)}
              className={`flex items-center space-x-1.5 py-1 px-2.5 rounded-lg border cursor-pointer active:scale-95 transition-all duration-150 text-[11px] font-bold ${
                isMeetingDropdownOpen 
                  ? 'bg-sky-500/10 border-transparent text-sky-500 shadow-xs' 
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-800 dark:hover:text-neutral-100'
              }`}
              title="G-Next Dynamic Calendar Timelines"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${upcomingMeetInfo?.isOngoing ? 'bg-neutral-500 animate-pulse' : 'bg-neutral-400'} inline-block shrink-0`} />
              <span className="text-[11px] max-w-[210px] truncate">
                {upcomingMeetInfo ? upcomingMeetInfo.label : 'No Corporate Meetings'}
              </span>
            </button>

            {/* Apple macOS-style raw dropdown layout (Simplicity, No headers or footers) */}
            <AnimatePresence>
              {isMeetingDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 2, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  className={`absolute right-0 top-full mt-1.5 w-72 rounded-xl shadow-2xl backdrop-blur-2xl overflow-hidden text-left z-50 p-2 space-y-1.5 ${
                    isDarkMode 
                      ? 'bg-neutral-900/95 text-neutral-200' 
                      : 'bg-white text-neutral-800 shadow-neutral-300/40'
                  }`}
                >
                  {calendarEvents.length === 0 ? (
                    <div className="p-4 text-center text-xs text-neutral-400 italic">
                      No corporate events registered.
                    </div>
                  ) : (
                    calendarEvents.map(event => {
                      const meetURL = getGoogleMeetLink(event);
                      const isMeetAvailable = event.location?.includes('meet.google.com') || event.title.toLowerCase().includes('sync') || event.title.toLowerCase().includes('workspace') || event.category === 'Work';
                      
                      const timeRaw = event.startTime.split('T')[1]?.substring(0, 5) || 'All Day';
                      const endRaw = event.endTime.split('T')[1]?.substring(0, 5) || '';

                      return (
                        <div 
                          key={event.id}
                          className={`p-2.5 rounded-lg transition-all text-xs flex flex-col space-y-2 select-all ${
                            isDarkMode 
                              ? 'bg-neutral-950/30 hover:bg-neutral-800' 
                              : 'bg-neutral-50/75 hover:bg-neutral-100'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5 truncate pr-2">
                              <div className="font-semibold truncate leading-snug">{event.title}</div>
                              <div className="text-[10px] text-neutral-400 font-mono">
                                {timeRaw} {endRaw ? ` - ${endRaw}` : ''}
                              </div>
                              {event.location && (
                                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-normal truncate mt-0.5 flex items-center space-x-1">
                                  <span>📍</span>
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>
                            
                            <span className="text-[9px] shrink-0 font-normal px-2 py-0.5 rounded-full font-mono capitalize tracking-tight bg-neutral-500/10 dark:bg-neutral-500/15 text-neutral-600 dark:text-neutral-400">
                              {event.category.substring(0, 10)}
                            </span>
                          </div>

                          {isMeetAvailable && (
                            <a
                              href={meetURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="self-start px-2.5 py-1 text-[9px] bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold rounded-md flex items-center justify-center transition-all cursor-pointer"
                            >
                              <span>Join</span>
                            </a>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Quit and Settings Menu Items */}
                  <div className={`mt-2 pt-2.5 space-y-0.5 ${
                    isDarkMode ? 'text-neutral-300' : 'text-neutral-600'
                  }`}>
                    <button
                      onClick={() => {
                        setIsMeetingDropdownOpen(false);
                        setActiveWindow('distraction');
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-between text-[11px] font-semibold ${
                        isDarkMode ? 'hover:bg-neutral-800 hover:text-white' : 'hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Focus Chamber</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsMeetingDropdownOpen(false);
                        onOpenShortcuts();
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-between text-[11px] font-semibold ${
                        isDarkMode ? 'hover:bg-neutral-800 hover:text-white' : 'hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400">
                        <Settings className="w-3.5 h-3.5" />
                        <span>Settings</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsMeetingDropdownOpen(false);
                        setShowQuitConfirm(true);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-between text-[11px] font-semibold ${
                        isDarkMode ? 'hover:bg-neutral-800 hover:text-white' : 'hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400">
                        <Power className="w-3.5 h-3.5" />
                        <span>Quit</span>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Toggle Dark/Light Mode */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 hover:bg-neutral-500/10 rounded-md transition-colors cursor-pointer text-neutral-400 hover:text-neutral-200"
            title="Toggle System Theme (Cmd+L)"
          >
            <Zap className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          </button>

          {/* Shortcuts */}
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 hover:bg-neutral-500/10 rounded-md transition-colors cursor-pointer text-neutral-400 hover:text-neutral-200"
            title="Custom Keyboard Shortcuts"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Sync Trigger */}
          <button 
            onClick={triggerSync}
            className="flex items-center space-x-1.5 p-1.5 hover:bg-neutral-500/10 rounded-md transition-colors cursor-pointer text-neutral-400 hover:text-neutral-200"
            title={`Secure Sync Status: ${syncState.status} - Click to Sync (Cmd+Option+S)`}
          >
            {getSyncIcon()}
            {syncState.status === 'syncing' && (
              <span className="hidden sm:inline text-[10px] opacity-75 text-neutral-500 dark:text-neutral-400">
                Syncing...
              </span>
            )}
          </button>

          <span className="opacity-25 text-gray-400">|</span>

          {/* System Stats Icons */}
          <div className="flex items-center space-x-2 text-neutral-400">
            <Wifi className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <div className="flex items-center space-x-1">
              <Battery className="w-4 h-4 text-neutral-500 dark:text-neutral-400 rotate-90" />
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">100%</span>
            </div>
          </div>

          <span className="opacity-25 text-gray-400">|</span>

          {/* Time and Date */}
          <div className="flex items-center space-x-2 font-medium">
            <span>{dateStr}</span>
            <span className="font-mono bg-neutral-500/10 px-1.5 py-0.5 rounded text-[11px]">{timeStr}</span>
          </div>
        </div>
      </div>

      {/* Center native Apple Confirmation dialog for Quitting */}
      <AnimatePresence>
        {showQuitConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-[99998] p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl text-center flex flex-col items-center space-y-4 ${
                isDarkMode 
                  ? 'bg-neutral-900/98 text-neutral-200' 
                  : 'bg-white text-neutral-800 shadow-neutral-300'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                <Power className="w-6 h-6" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold tracking-tight">Quit Workspace Client?</h3>
                <p className="text-xs text-neutral-400 leading-normal">
                  Any active focus durations will be locked. Local task definitions remain persisted in your browser's workspace secure offline cache.
                </p>
              </div>

              <div className="flex items-center space-x-2 w-full pt-1.5">
                <button
                  onClick={() => setShowQuitConfirm(false)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                    isDarkMode 
                      ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-750 text-neutral-300' 
                      : 'bg-neutral-100 border-neutral-200 hover:bg-neutral-150 text-neutral-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowQuitConfirm(false);
                    setIsQuitted(true);
                  }}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/10"
                >
                  Quit Client
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Immersive Apple Shutdown / Quit state */}
      <AnimatePresence>
        {isQuitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950 flex flex-col items-center justify-center z-[99999] text-center p-4"
          >
            <div 
              className="w-16 h-16 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center shadow-2xl mb-4 hover:border-sky-500 hover:shadow-sky-500/10 duration-200 cursor-pointer group active:scale-95" 
              onClick={() => setIsQuitted(false)}
              title="Boot G-Next Workspace Launcher"
            >
              <Zap className="w-6 h-6 text-neutral-400 group-hover:text-sky-400 transition-colors animate-pulse" />
            </div>
            <h2 className="text-sm font-bold text-neutral-200 tracking-tight">G-Next Terminated Securely</h2>
            <p className="text-[11px] text-neutral-400 mt-1.5 max-w-xs leading-relaxed">
              Offline container cache locked down and resources safely deactivated. Click the launch toggle above to revive the G-Next corporate client environment.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
