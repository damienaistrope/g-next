/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  CheckCircle, 
  Circle, 
  Clock, 
  Sparkles, 
  Command, 
  Search, 
  Calendar, 
  ArrowRight, 
  ChevronRight, 
  ChevronDown, 
  Tag, 
  AlertCircle, 
  X, 
  List, 
  Briefcase, 
  Inbox, 
  User, 
  BookOpen,
  Filter,
  Download,
  Terminal,
  Cpu,
  ShieldAlert,
  Settings,
  Edit3,
  HelpCircle
} from 'lucide-react';
import { Task, CalendarEvent, ListType, KeyboardShortcut, CloudSyncState } from './types';
import { INITIAL_LISTS, INITIAL_TASKS, INITIAL_CALENDAR_EVENTS, DEFAULT_SHORTCUTS } from './data';
import MacMenuBar from './components/MacMenuBar';
import FocusWidget from './components/FocusWidget';
import DmgDownloadModal from './components/DmgDownloadModal';
import SettingsModal from './components/SettingsModal';
import OnboardingModal from './components/OnboardingModal';
import HelpAndAboutView from './components/HelpAndAboutView';
import MarketingLanding from './components/MarketingLanding';
import { motion, AnimatePresence } from 'motion/react';
import { initAuth, googleSignIn, logout } from './lib/firebaseAuth';
import { fetchGoogleCalendarEvents, createGoogleCalendarEvent } from './lib/googleCalendar';
import { User as FirebaseUser } from 'firebase/auth';

const TODAY_STR = '2026-05-23';
const TOMORROW_STR = '2026-05-24';

export default function App() {
  // Theme & Window State
  const [isDarkMode, setIsDarkMode] = React.useState<boolean>(true);
  const [activeWindow, setActiveWindow] = React.useState<'app' | 'distraction' | 'dmg' | 'settings' | 'help'>('app');
  const [viewMode, setViewMode] = React.useState<'landing' | 'app'>('landing');
  
  // Custom Modals
  const [showSettingsModal, setShowSettingsModal] = React.useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = React.useState<boolean>(false);
  
  // Acoustic & Sound States
  const [soundEnabled, setSoundEnabled] = React.useState<boolean>(true);
  const [meetingEndChimeEnabled, setMeetingEndChimeEnabled] = React.useState<boolean>(true);
  const [ambientSound, setAmbientSound] = React.useState<'none' | 'brown' | 'binaural' | 'rain'>('none');
  const [timerDuration, setTimerDuration] = React.useState<number>(25);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState<boolean>(true);
  const [colorCategoriesEnabled, setColorCategoriesEnabled] = React.useState<boolean>(false);
  const [customListColor, setCustomListColor] = React.useState<string>('indigo');
  
  // App Core State
  const [lists, setLists] = React.useState<ListType[]>(INITIAL_LISTS);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = React.useState<CalendarEvent[]>([]);
  const [shortcuts, setShortcuts] = React.useState<KeyboardShortcut[]>(DEFAULT_SHORTCUTS);
  const [syncState, setSyncState] = React.useState<CloudSyncState>({
    status: 'synced',
    lastSyncedAt: '23:51'
  });

  // Google Auth & Live Calendar State variables
  const [googleUser, setGoogleUser] = React.useState<FirebaseUser | null>(null);
  const [googleToken, setGoogleToken] = React.useState<string | null>(null);
  const [isSyncingCalendar, setIsSyncingCalendar] = React.useState<boolean>(false);
  const [calendarSyncError, setCalendarSyncError] = React.useState<string | null>(null);

  // Filter & Search State
  const [selectedListId, setSelectedListId] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  
  // New Task Quick-Input State
  const [quickTitle, setQuickTitle] = React.useState<string>('');
  const [quickStartTime, setQuickStartTime] = React.useState<string>('');
  const [quickDuration, setQuickDuration] = React.useState<string>('25');
  const [quickPriority, setQuickPriority] = React.useState<'low' | 'medium' | 'high'>('medium');
  const [quickListId, setQuickListId] = React.useState<string>('inbox');
  const [isAddingTaskInline, setIsAddingTaskInline] = React.useState<boolean>(false);
  const [customListTitle, setCustomListTitle] = React.useState<string>('');
  const [showAddListForm, setShowAddListForm] = React.useState<boolean>(false);
  
  // Custom directory (list) editing/deleting state
  const [editingListId, setEditingListId] = React.useState<string | null>(null);
  const [editingListTitle, setEditingListTitle] = React.useState<string>('');
  const [editingListColor, setEditingListColor] = React.useState<string>('indigo');
  const [deletingListId, setDeletingListId] = React.useState<string | null>(null);

  // Focus Search Bar input reference
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // 1. Initial State Load (Offline LocalStorage Capability)
  React.useEffect(() => {
    // Determine Dark Mode from OS preference if not custom-saved
    const localTheme = localStorage.getItem('upnext_theme');
    if (localTheme) {
      setIsDarkMode(localTheme === 'dark');
    } else {
      setIsDarkMode(true); // default premium dark theme
    }

    // Determine Onboarding completion
    const completedOnboard = localStorage.getItem('upnext_onboarding_done');
    if (!completedOnboard) {
      setShowOnboarding(true);
    }

    // Determine Sound preferences
    const savedSound = localStorage.getItem('upnext_sound_enabled');
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }

    const savedChime = localStorage.getItem('upnext_meeting_chime_enabled');
    if (savedChime !== null) {
      setMeetingEndChimeEnabled(savedChime === 'true');
    }

    const savedAmbient = localStorage.getItem('upnext_ambient_sound');
    if (savedAmbient !== null) {
      setAmbientSound(savedAmbient as any);
    }

    const savedTimer = localStorage.getItem('upnext_timer_duration');
    if (savedTimer !== null) {
      setTimerDuration(parseInt(savedTimer, 10) || 25);
    }

    const savedNotify = localStorage.getItem('upnext_notifications_enabled');
    if (savedNotify !== null) {
      setNotificationsEnabled(savedNotify === 'true');
    }

    const savedColorsPref = localStorage.getItem('upnext_color_categories_enabled');
    if (savedColorsPref !== null) {
      setColorCategoriesEnabled(savedColorsPref === 'true');
    }

    // Load Tasks
    const savedTasks = localStorage.getItem('upnext_tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      const initial = INITIAL_TASKS(TODAY_STR, TOMORROW_STR);
      setTasks(initial);
      localStorage.setItem('upnext_tasks', JSON.stringify(initial));
    }

    // Load Lists
    const savedLists = localStorage.getItem('upnext_lists');
    if (savedLists) {
      setLists(JSON.parse(savedLists));
    } else {
      setLists(INITIAL_LISTS);
      localStorage.setItem('upnext_lists', JSON.stringify(INITIAL_LISTS));
    }

    // Load Calendar Events
    const savedCalendars = localStorage.getItem('upnext_calendar_events');
    if (savedCalendars) {
      setCalendarEvents(JSON.parse(savedCalendars));
    } else {
      const initialCal = INITIAL_CALENDAR_EVENTS(TODAY_STR, TOMORROW_STR);
      setCalendarEvents(initialCal);
      localStorage.setItem('upnext_calendar_events', JSON.stringify(initialCal));
    }

    // Load Shortcuts
    const savedShortcuts = localStorage.getItem('upnext_shortcuts');
    if (savedShortcuts) {
      setShortcuts(JSON.parse(savedShortcuts));
    } else {
      setShortcuts(DEFAULT_SHORTCUTS);
      localStorage.setItem('upnext_shortcuts', JSON.stringify(DEFAULT_SHORTCUTS));
    }
  }, []);

  // Load real Google Calendar Auth state
  React.useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        // fetch real Google events helper
        handleSyncGoogleCalendar(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, [googleToken]);

  const handleSyncGoogleCalendar = async (tokenToUse?: string) => {
    const token = tokenToUse || googleToken;
    if (!token) return;
    
    setIsSyncingCalendar(true);
    setCalendarSyncError(null);
    try {
      const liveEvents = await fetchGoogleCalendarEvents(token);
      if (liveEvents) {
        setCalendarEvents(liveEvents);
        localStorage.setItem('upnext_calendar_events', JSON.stringify(liveEvents));
      }
      triggerSync();
    } catch (err: any) {
      console.error("Error syncing Google Calendar:", err);
      setCalendarSyncError("API authorization expired or scope was revoked.");
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setCalendarSyncError(null);
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        handleSyncGoogleCalendar(result.accessToken);
      }
    } catch (err: any) {
      console.error("Google login failed:", err);
      setCalendarSyncError("Popup connection was cancelled or rejected.");
    }
  };

  const handleGoogleSignOut = async () => {
    await logout();
    setGoogleUser(null);
    setGoogleToken(null);
    const initialCal = INITIAL_CALENDAR_EVENTS(TODAY_STR, TOMORROW_STR);
    setCalendarEvents(initialCal);
    localStorage.setItem('upnext_calendar_events', JSON.stringify(initialCal));
    triggerSync();
  };

  // Warning alarm warning chime for meeting end dates
  const playedMeetingEndChimesRef = React.useRef<string[]>([]);

  const playMeetingEndChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); 
      osc.frequency.setValueAtTime(698.46, ctx.currentTime + 0.25); 
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.65);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.75);
    } catch (e) {
      console.log('Meeting end audio chime context error or blocked:', e);
    }
  };

  React.useEffect(() => {
    if (!meetingEndChimeEnabled) return;

    const checkMeetingEndAlerts = () => {
      try {
        const now = new Date();
        const nowTime = now.getTime();

        calendarEvents.forEach((event) => {
          if (!event.endTime) return;

          const eventEndTime = new Date(event.endTime).getTime();

          // If the event ends right now (within 60s window) and we haven't played the alert for this event
          if (
            Math.abs(nowTime - eventEndTime) < 45000 &&
            !playedMeetingEndChimesRef.current.includes(event.id)
          ) {
            console.log("Playing warning chime for meeting ending:", event.title);
            playedMeetingEndChimesRef.current.push(event.id);
            playMeetingEndChime();
          }
        });
      } catch (e) {
        console.warn("Meeting end chime scheduler error:", e);
      }
    };

    const interval = setInterval(checkMeetingEndAlerts, 10000);
    return () => clearInterval(interval);
  }, [calendarEvents, meetingEndChimeEnabled]);

  const handleExportTaskToGoogleCalendar = async (task: Task) => {
    if (!googleToken) {
      alert("Please connect Google Calendar in the sidebar first.");
      return;
    }
    const confirmed = window.confirm(`Authorize export of "${task.title}" task slots to your Google Calendar account?`);
    if (!confirmed) return;

    // formulate start and end times for Google Calendar
    // default to today at the start time
    const datePartStr = TODAY_STR; // '2026-05-23'
    
    let startTimeStr = `${datePartStr}T12:00:00`;
    let endTimeStr = `${datePartStr}T12:30:00`;

    if (task.startTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(task.startTime)) {
      startTimeStr = `${datePartStr}T${task.startTime}:00`;
      const [hours, mins] = task.startTime.split(':').map(Number);
      const durationMins = task.duration || 25;
      const endMinutesTotal = hours * 60 + mins + durationMins;
      const endHours = Math.floor(endMinutesTotal / 60) % 24;
      const endMins = endMinutesTotal % 60;
      endTimeStr = `${datePartStr}T${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`;
    }

    try {
      setIsSyncingCalendar(true);
      const newEvent = await createGoogleCalendarEvent(googleToken, {
        title: task.title,
        startTime: startTimeStr,
        endTime: endTimeStr,
        location: 'Focus Work Mode Room',
        notes: task.notes || 'Created via G-Next Sonoma task exporter'
      });
      // append to current calendar events
      const nextCal = [newEvent, ...calendarEvents];
      setCalendarEvents(nextCal);
      localStorage.setItem('upnext_calendar_events', JSON.stringify(nextCal));
      alert(`Synchronized: "${task.title}" exported successfully and mapped into timeline!`);
      triggerSync();
    } catch (err: any) {
      console.error("Failed to export event:", err);
      alert("Error exporting task to Google Calendar: " + err.message);
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  // Sync state helpers
  const triggerSync = () => {
    if (syncState.status === 'syncing') return;
    
    setSyncState(prev => ({ ...prev, status: 'syncing' }));
    
    setTimeout(() => {
      const now = new Date();
      const timeStr = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
      setSyncState({
        status: 'synced',
        lastSyncedAt: timeStr
      });
      // Toast / Audio success indicator
      console.log("Secure Workspace synced successfully at: ", timeStr);
    }, 1200);
  };

  // State Persistence syncs
  const saveTasksToLocalStorage = (updatedTasks: Task[]) => {
    localStorage.setItem('upnext_tasks', JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
  };

  const saveListsToLocalStorage = (updatedLists: ListType[]) => {
    localStorage.setItem('upnext_lists', JSON.stringify(updatedLists));
    setLists(updatedLists);
  };

  // Keyboard shortcut system capture keys
  React.useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // 1. Intercept CMD + Comma on Mac to trigger System Settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        e.stopPropagation();
        setActiveWindow('settings');
        return;
      }

      // Don't intercept when focusing input fields, except for special exit combinations
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') !== null);

      const pressedKey = e.key.toUpperCase();

      for (const sc of shortcuts) {
        // Match modifier parameters
        const metaMatch = sc.metaKey === e.metaKey;
        const altMatch = sc.altKey === e.altKey;
        const ctrlMatch = sc.ctrlKey === e.ctrlKey;
        const shiftMatch = sc.shiftKey === e.shiftKey;
        const keyMatch = (sc.key === 'SPACE' ? ' ' : sc.key) === pressedKey;

        if (metaMatch && altMatch && ctrlMatch && shiftMatch && keyMatch) {
          e.preventDefault();
          e.stopPropagation();

          // Execute action based on ID
          switch (sc.id) {
            case 'quick-add':
              if (activeWindow === 'app') {
                setIsAddingTaskInline(prev => !prev);
              } else {
                setActiveWindow('app');
                setIsAddingTaskInline(true);
              }
              break;
            case 'toggle-distraction':
              setActiveWindow(prev => prev === 'distraction' ? 'app' : 'distraction');
              break;
            case 'search':
              setActiveWindow('app');
              setTimeout(() => {
                searchInputRef.current?.focus();
              }, 50);
              break;
            case 'trigger-sync':
              triggerSync();
              break;
            case 'toggle-dark':
              setIsDarkMode(prev => {
                const next = !prev;
                localStorage.setItem('upnext_theme', next ? 'dark' : 'light');
                return next;
              });
              break;
            default:
              break;
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts, true);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts, true);
  }, [shortcuts, activeWindow]);

  // Create Task Core Action
  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: quickTitle,
      subtitle: 'Created via fast-input Sonoma container',
      completed: false,
      listId: quickListId,
      startTime: quickStartTime || undefined,
      duration: quickDuration ? parseInt(quickDuration, 10) : undefined,
      priority: quickPriority,
      timeSpent: 0,
      estimatedMinutes: quickDuration ? parseInt(quickDuration, 10) : 25,
      dueDate: TODAY_STR
    };

    const nextTasks = [newTask, ...tasks];
    saveTasksToLocalStorage(nextTasks);

    // Reset Form
    setQuickTitle('');
    setQuickStartTime('');
    setQuickDuration('25');
    setQuickPriority('medium');
    setIsAddingTaskInline(false);
    triggerSync();
  };

  // Toggle Task Completion State
  const handleToggleTask = (taskId: string) => {
    const nextTasks = tasks.map(t => {
      if (t.id === taskId) {
        const compl = !t.completed;
        return { ...t, completed: compl };
      }
      return t;
    });
    saveTasksToLocalStorage(nextTasks);
    triggerSync();
  };

  // Simple task deletion
  const handleDeleteTask = (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextTasks = tasks.filter(t => t.id !== taskId);
    saveTasksToLocalStorage(nextTasks);
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
    triggerSync();
  };

  // Task Details update
  const handleUpdateTaskDetail = (updated: Task) => {
    const nextTasks = tasks.map(t => (t.id === updated.id ? updated : t));
    saveTasksToLocalStorage(nextTasks);
  };

  // Distraction Pro Snooze handler
  const handleSnoozeFocusTask = (taskId: string) => {
    const nextTasks = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          isSnoozed: true,
          startTime: undefined // pushes it out of currently active slot
        };
      }
      return t;
    });
    saveTasksToLocalStorage(nextTasks);
    triggerSync();
    setActiveWindow('app'); // exit distraction layer to regroup
  };

  // Custom Category List creation
  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customListTitle.trim()) return;

    const newList: ListType = {
      id: `list-${Date.now()}`,
      name: customListTitle,
      color: customListColor,
      iconName: 'List'
    };

    const nextLists = [...lists, newList];
    saveListsToLocalStorage(nextLists);
    setCustomListTitle('');
    setShowAddListForm(false);
    triggerSync();
  };

  const handleAddTaskDirectly = (title: string, priority: 'low' | 'medium' | 'high', duration: number) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      subtitle: 'Created directly inside focus chamber',
      completed: false,
      listId: 'inbox',
      priority,
      duration,
      timeSpent: 0,
      estimatedMinutes: duration,
      dueDate: TODAY_STR
    };
    const nextTasks = [newTask, ...tasks];
    saveTasksToLocalStorage(nextTasks);
    triggerSync();
  };

  // Compile tasks and calendar events into single sorted timeline representing "Up Next" today
  const getUpNextChronology = () => {
    // Collect active items for current timeline index
    const activeTasks = tasks.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchList = selectedListId === 'all' || t.listId === selectedListId;
      return matchSearch && matchList;
    });

    const activeCal = calendarEvents.filter(c => {
      const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
      // map general category matches if requested
      return matchSearch;
    });

    // We represent elements structurally
    interface FlowItem {
      type: 'task' | 'calendar';
      timeValue?: string; // HH:MM for sorting
      item: any;
    }

    const compiledItems: FlowItem[] = [];

    activeTasks.forEach(task => {
      compiledItems.push({
        type: 'task',
        timeValue: task.startTime || '99:99', // items with times float to top chronologically
        item: task
      });
    });

    activeCal.forEach(event => {
      // extract HH:MM from ISO
      const isoTime = event.startTime.split('T')[1]?.substring(0, 5) || '00:00';
      compiledItems.push({
        type: 'calendar',
        timeValue: isoTime,
        item: event
      });
    });

    // Chronological ascending sorting
    compiledItems.sort((a, b) => {
      if (a.timeValue === b.timeValue) {
        // prioritizes calendar events if equal duration space
        if (a.type === 'calendar' && b.type === 'task') return -1;
        if (a.type === 'task' && b.type === 'calendar') return 1;
        return 0;
      }
      return (a.timeValue || '99:99').localeCompare(b.timeValue || '99:99');
    });

    return compiledItems;
  };

  const chronologyList = getUpNextChronology();

  // Find the single absolute top task currently on focus queue (first uncompleted task)
  const focusQueueTask = tasks.find(t => !t.completed && !t.isSnoozed);

  const getListIcon = (iconName: string) => {
    switch (iconName) {
      case 'Inbox':
        return <Inbox className="w-4.5 h-4.5" />;
      case 'Briefcase':
        return <Briefcase className="w-4.5 h-4.5" />;
      case 'User':
        return <User className="w-4.5 h-4.5" />;
      case 'BookOpen':
        return <BookOpen className="w-4.5 h-4.5" />;
      default:
        return <List className="w-4.5 h-4.5" />;
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'bg-rose-500';
      case 'medium':
        return 'bg-sky-500';
      case 'low':
      default:
        return 'bg-emerald-500';
    }
  };

  if (viewMode === 'landing') {
    return (
      <MarketingLanding 
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onEnterApp={() => setViewMode('app')}
      />
    );
  }

  return (
    <div id="desktop-canvas" className={`w-full min-h-screen relative overflow-hidden font-sans select-none tracking-tight flex flex-col transition-all duration-500 ${
      isDarkMode ? 'dark bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-800'
    }`}>
      
      {/* Dynamic Sonoma Ambient Backdrops Circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full filter blur-[120px] opacity-25 mix-blend-screen transition-all duration-700 ${
          isDarkMode ? 'bg-indigo-600' : 'bg-indigo-300'
        }`} />
        <div className={`absolute top-1/3 right-10 w-[500px] h-[500px] rounded-full filter blur-[140px] opacity-20 mix-blend-screen transition-all duration-700 ${
          isDarkMode ? 'bg-sky-500' : 'bg-sky-200'
        }`} />
        <div className={`absolute -bottom-20 left-1/4 w-[450px] h-[450px] rounded-full filter blur-[100px] opacity-15 mix-blend-screen transition-all duration-700 ${
          isDarkMode ? 'bg-emerald-500' : 'bg-emerald-200'
        }`} />
      </div>

      {/* Top Bar macOS Simulator */}
      <MacMenuBar 
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        syncState={syncState}
        triggerSync={triggerSync}
        onOpenShortcuts={() => setActiveWindow('settings')}
        onOpenDmgMode={() => setActiveWindow('dmg')}
        activeWindow={activeWindow}
        setActiveWindow={setActiveWindow}
        currentFocusTaskName={focusQueueTask?.title}
        calendarEvents={calendarEvents}
        onExitSimulator={() => setViewMode('landing')}
      />

      {/* Main Content Areas inside canvas viewports */}
      <div className="grow w-full relative z-10 p-4 md:p-8 flex items-center justify-center">
        
        <AnimatePresence mode="wait">
          
          {/* 1. Main Classic Up Next Client Window */}
          {activeWindow === 'app' && (
            <motion.div 
              key="main-app"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className={`w-full max-w-6xl h-[680px] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden backdrop-blur-xl ${
                isDarkMode 
                  ? 'bg-[#161616] text-neutral-200' 
                  : 'bg-white text-neutral-800 shadow-slate-200/40'
              }`}
            >
              
              {/* Sidebar filter column (Glassmorphic thin layout) */}
              <div className={`w-full md:w-56 flex flex-col justify-between p-4 shrink-0 [content-visibility:auto] ${
                isDarkMode ? 'bg-[#161616]' : 'bg-white'
              }`}>
                <div className="flex flex-col h-full justify-between space-y-6">
                  
                  {/* TOP NAV: Traffic Lights & Custom Lists */}
                  <div className="space-y-6">
                    {/* Sonoma App Traffic Lights */}
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500 block hover:opacity-80 transition-opacity" />
                      <span className="w-3 h-3 rounded-full bg-yellow-500 block hover:opacity-80 transition-opacity" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500 block hover:opacity-80 transition-opacity" />
                    </div>

                    {/* Built-in Directories */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block px-2 mb-2">
                        Directories
                      </span>
                      <button
                        onClick={() => { setSelectedListId('all'); setSelectedTaskId(null); }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border cursor-pointer transition-all duration-150 ${
                          selectedListId === 'all' 
                            ? 'bg-sky-500/15 border-sky-500/45 text-sky-450 font-extrabold' 
                            : isDarkMode
                              ? 'border-transparent text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-200'
                              : 'border-transparent text-neutral-500 hover:bg-neutral-500/10 hover:text-neutral-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span>All</span>
                        </div>
                        <span className={`text-[9px] font-semibold min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full transition-all ${
                          selectedListId === 'all'
                            ? 'bg-sky-500 text-white'
                            : 'bg-neutral-500/10 text-neutral-400 dark:text-neutral-500'
                        }`}>
                          {tasks.filter(t => !t.completed).length}
                        </span>
                      </button>

                      {lists.filter(lst => ['inbox', 'work', 'personal', 'learning'].includes(lst.id)).map(lst => {
                        const count = tasks.filter(t => t.listId === lst.id && !t.completed).length;
                        return (
                          <button
                            key={lst.id}
                            onClick={() => { setSelectedListId(lst.id); setSelectedTaskId(null); }}
                            className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border cursor-pointer transition-all duration-150 ${
                              selectedListId === lst.id 
                                ? 'bg-sky-500/15 border-sky-500/45 text-sky-450 font-extrabold' 
                                : isDarkMode
                                  ? 'border-transparent text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-200'
                                  : 'border-transparent text-neutral-500 hover:bg-neutral-500/10 hover:text-neutral-800'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              {colorCategoriesEnabled && (
                                <span className={`w-2 h-2 rounded-full shrink-0 ${
                                  lst.color === 'indigo' ? 'bg-indigo-500' :
                                  lst.color === 'sky' ? 'bg-sky-500' :
                                  lst.color === 'emerald' ? 'bg-emerald-500' :
                                  lst.color === 'violet' ? 'bg-violet-500' : 'bg-rose-500'
                                }`} />
                              )}
                              <span>{lst.name}</span>
                            </div>
                            {count > 0 ? (
                              <span className={`text-[9px] font-semibold min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full transition-all ${
                                selectedListId === lst.id
                                  ? 'bg-sky-500 text-white'
                                  : 'bg-neutral-500/10 text-neutral-400 dark:text-neutral-400'
                              }`}>
                                {count}
                              </span>
                            ) : (
                              <span className="w-5 h-5 shrink-0" />
                            )}
                          </button>
                        );
                      })}

                      {/* Add New Custom Category List Module Category Section */}
                      <div className="pt-2">
                        {showAddListForm ? (
                          <form onSubmit={handleCreateList} className="space-y-2 p-1.5 bg-neutral-500/5 rounded-xl border border-neutral-500/10">
                            <input
                              type="text"
                              placeholder="Name..."
                              value={customListTitle}
                              onChange={(e) => setCustomListTitle(e.target.value)}
                              className={`w-full px-2.5 py-1.5 text-xs rounded-lg outline-none font-bold ${
                                isDarkMode ? 'bg-neutral-900 text-neutral-100' : 'bg-neutral-150 text-neutral-800'
                              }`}
                              maxLength={16}
                              autoFocus
                            />
                            
                            {/* Theme Swatches (Off by default, but customizable) */}
                            <div className="flex items-center justify-between p-1 bg-neutral-500/5 rounded-lg border border-neutral-500/5 w-full">
                              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest pl-1">Color</span>
                              <div className="flex items-center space-x-1.5 pr-1">
                                {['indigo', 'sky', 'emerald', 'violet', 'rose'].map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCustomListColor(c)}
                                    className={`w-3 h-3 rounded-full cursor-pointer transition-all border ${
                                      c === 'indigo' ? 'bg-indigo-500' :
                                      c === 'sky' ? 'bg-sky-500' :
                                      c === 'emerald' ? 'bg-emerald-500' :
                                      c === 'violet' ? 'bg-violet-500' : 'bg-rose-500'
                                    } ${
                                      customListColor === c 
                                        ? 'ring-1 ring-sky-450 border-white scale-110' 
                                        : 'border-transparent opacity-65 hover:opacity-100'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="flex justify-end space-x-1 pr-1 pb-1">
                              <button
                                type="button"
                                onClick={() => setShowAddListForm(false)}
                                className="text-[10px] hover:bg-neutral-500/15 px-2.5 py-1 rounded-lg cursor-pointer text-neutral-400 font-bold"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="text-[10px] bg-sky-500 text-white px-2.5 py-1 rounded-lg font-bold cursor-pointer"
                              >
                                Add
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => setShowAddListForm(true)}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border cursor-pointer transition-all duration-150 ${
                              isDarkMode 
                                ? 'border-transparent text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-200' 
                                : 'border-transparent text-neutral-500 hover:bg-neutral-500/10 hover:text-neutral-800'
                            }`}
                            title="Create a new custom task list"
                          >
                            <div className="flex items-center space-x-2">
                              <Plus className="w-4 h-4 text-sky-500 shrink-0" />
                              <span>Create List</span>
                            </div>
                          </button>
                        )}
                      </div>

                      {/* User-created custom lists displayed under Create List */}
                      {lists.filter(lst => !['inbox', 'work', 'personal', 'learning'].includes(lst.id)).map(lst => {
                        const count = tasks.filter(t => t.listId === lst.id && !t.completed).length;
                        const isEditingThis = editingListId === lst.id;
                        const isDeletingThis = deletingListId === lst.id;

                        if (isEditingThis) {
                          return (
                            <form 
                              key={lst.id}
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!editingListTitle.trim()) return;
                                const updatedLists = lists.map(l => l.id === lst.id ? { ...l, name: editingListTitle, color: editingListColor } : l);
                                saveListsToLocalStorage(updatedLists);
                                setEditingListId(null);
                                triggerSync();
                              }}
                              className="space-y-2 p-1.5 bg-neutral-500/5 rounded-xl border border-neutral-500/10 mt-1"
                            >
                              <input
                                type="text"
                                value={editingListTitle}
                                onChange={(e) => setEditingListTitle(e.target.value)}
                                className={`w-full px-2 py-1 text-xs rounded-lg outline-none font-bold ${
                                  isDarkMode ? 'bg-neutral-900 text-neutral-100' : 'bg-neutral-150 text-neutral-800'
                                }`}
                                maxLength={16}
                                autoFocus
                              />
                              <div className="flex items-center justify-between p-1 bg-neutral-500/5 rounded-lg border border-neutral-500/5 w-full">
                                <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest pl-1">Color</span>
                                <div className="flex items-center space-x-1.5 pr-1">
                                  {['indigo', 'sky', 'emerald', 'violet', 'rose'].map((c) => (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => setEditingListColor(c)}
                                      className={`w-3 h-3 rounded-full cursor-pointer transition-all border ${
                                        c === 'indigo' ? 'bg-indigo-500' :
                                        c === 'sky' ? 'bg-sky-500' :
                                        c === 'emerald' ? 'bg-emerald-500' :
                                        c === 'violet' ? 'bg-violet-500' : 'bg-rose-500'
                                      } ${
                                        editingListColor === c 
                                          ? 'ring-1 ring-sky-450 border-white scale-110' 
                                          : 'border-transparent opacity-65 hover:opacity-100'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="flex justify-end space-x-1 pr-1 pb-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingListId(null)}
                                  className="text-[10px] hover:bg-neutral-500/15 px-2 py-1 rounded-lg cursor-pointer text-neutral-400 font-bold"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="text-[10px] bg-sky-500 text-white px-2 py-1 rounded-lg font-bold cursor-pointer"
                                >
                                  Save
                                </button>
                              </div>
                            </form>
                          );
                        }

                        if (isDeletingThis) {
                          return (
                            <div 
                              key={lst.id}
                              className="p-1.5 bg-rose-500/5 rounded-xl border border-rose-500/20 mt-1 space-y-1.5"
                            >
                              <p className="text-[10px] text-rose-500/90 font-bold px-1 select-none leading-tight">
                                Delete Directory? Tasks inside move to Inbox.
                              </p>
                              <div className="flex justify-end space-x-1.5 pr-1 pb-0.5">
                                <button
                                  type="button"
                                  onClick={() => setDeletingListId(null)}
                                  className="text-[9px] hover:bg-neutral-500/10 px-2 py-0.5 rounded font-bold text-neutral-400 cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedTasks = tasks.map(t => t.listId === lst.id ? { ...t, listId: 'inbox' } : t);
                                    const updatedLists = lists.filter(l => l.id !== lst.id);
                                    saveTasksToLocalStorage(updatedTasks);
                                    saveListsToLocalStorage(updatedLists);
                                    setDeletingListId(null);
                                    if (selectedListId === lst.id) {
                                      setSelectedListId('all');
                                    }
                                    triggerSync();
                                  }}
                                  className="text-[9px] bg-rose-500 text-white px-2 py-0.5 rounded font-bold cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={lst.id}
                            className="group relative w-full"
                          >
                            <button
                              onClick={() => { setSelectedListId(lst.id); setSelectedTaskId(null); }}
                              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border cursor-pointer transition-all duration-150 ${
                                selectedListId === lst.id 
                                  ? 'bg-sky-500/15 border-sky-500/45 text-sky-450 font-extrabold' 
                                  : isDarkMode
                                    ? 'border-transparent text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-200'
                                    : 'border-transparent text-neutral-500 hover:bg-neutral-500/10 hover:text-neutral-800'
                              }`}
                            >
                              <div className="flex items-center space-x-2 mr-10 truncate">
                                {colorCategoriesEnabled && (
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                                    lst.color === 'indigo' ? 'bg-indigo-500' :
                                    lst.color === 'sky' ? 'bg-sky-500' :
                                    lst.color === 'emerald' ? 'bg-emerald-500' :
                                    lst.color === 'violet' ? 'bg-violet-500' : 'bg-rose-500'
                                  }`} />
                                )}
                                <span className="truncate">{lst.name}</span>
                              </div>
                              <span className="flex items-center shrink-0">
                                {count > 0 ? (
                                  <span className={`text-[9px] font-semibold min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full transition-all group-hover:opacity-0 ${
                                    selectedListId === lst.id
                                      ? 'bg-sky-500 text-white'
                                      : 'bg-neutral-500/10 text-neutral-400 dark:text-neutral-400'
                                  }`}>
                                    {count}
                                  </span>
                                ) : (
                                  <span className="w-5 h-5 shrink-0 group-hover:opacity-0" />
                                )}
                              </span>
                            </button>

                            {/* Hover Edit/Delete controls */}
                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center space-x-0.5 bg-transparent p-0.5 rounded-lg z-20">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingListId(lst.id);
                                  setEditingListTitle(lst.name);
                                  setEditingListColor(lst.color);
                                }}
                                className="p-1 hover:bg-neutral-500/15 hover:text-sky-500 rounded text-neutral-400 cursor-pointer transition-colors"
                                title="Edit Directory Name"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingListId(lst.id);
                                }}
                                className="p-1 hover:bg-rose-500/15 hover:text-rose-500 rounded text-neutral-400 cursor-pointer transition-colors"
                                title="Delete Directory"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* BOTTOM NAV: Moved distraction free & settings to the screen bottom */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block px-2 mb-1.5">
                      Other
                    </span>
                    
                    <button
                      onClick={() => setActiveWindow('distraction')}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border cursor-pointer transition-all duration-150 ${
                        activeWindow === 'distraction'
                          ? 'bg-sky-500/15 border-sky-500/40 text-sky-450 font-extrabold'
                          : isDarkMode 
                            ? 'border-transparent text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-200' 
                            : 'border-transparent text-neutral-500 hover:bg-neutral-500/10 hover:text-neutral-800'
                      }`}
                      title="Switch to Distraction-Free Workspace Timer"
                    >
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-sky-500 shrink-0" />
                        <span>Focus Chamber</span>
                      </div>
                    </button>

                    {/* Help & About Launcher Widget */}
                    <button
                      onClick={() => setActiveWindow('help')}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border cursor-pointer transition-all duration-150 ${
                        activeWindow === 'help'
                          ? 'bg-sky-500/15 border-sky-500/40 text-sky-450 font-extrabold'
                          : isDarkMode 
                            ? 'border-transparent text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-200' 
                            : 'border-transparent text-neutral-500 hover:bg-neutral-500/10 hover:text-neutral-800'
                      }`}
                      title="Open Help & About Guidebook"
                    >
                      <div className="flex items-center space-x-2">
                        <HelpCircle className="w-4 h-4 text-sky-500 shrink-0" />
                        <span>Help & About</span>
                      </div>
                    </button>

                    {/* Sonoma Settings Launcher Widget */}
                    <button
                      onClick={() => setActiveWindow('settings')}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border cursor-pointer transition-all duration-150 ${
                        activeWindow === 'settings'
                          ? 'bg-sky-500/15 border-sky-500/40 text-sky-450 font-extrabold'
                          : isDarkMode 
                            ? 'border-transparent text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-200' 
                            : 'border-transparent text-neutral-500 hover:bg-neutral-500/10 hover:text-neutral-800'
                      }`}
                      title="Open System Settings"
                    >
                      <div className="flex items-center space-x-2">
                        <Settings className="w-4 h-4 text-sky-500 shrink-0" />
                        <span>Settings</span>
                      </div>
                    </button>
                  </div>

                </div>
              </div>

              {/* Middle Section: Search, Chronicle List and Add Task Input form */}
              <div className="grow flex-1 flex flex-col min-w-0">
                               {/* Search Bar / Input block */}
                <div className={`p-4 flex items-center justify-between space-x-4 ${
                  isDarkMode ? 'bg-neutral-950/10' : 'bg-white/10'
                }`}>
                  <div className="relative grow">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search tasks, calendar times, focus notes... (Cmd+K)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl outline-none border focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors ${
                        isDarkMode 
                          ? 'bg-neutral-900 border-neutral-500/10 text-neutral-100' 
                          : 'bg-white border-neutral-500/10 text-neutral-800'
                      }`}
                    />
                  </div>

                  {/* Sonoma Add Shortcut Helper */}
                  <button
                    onClick={() => setIsAddingTaskInline(prev => !prev)}
                    className="p-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl cursor-pointer transition-all select-none hover:scale-[1.03] active:scale-[0.97] shrink-0 flex items-center justify-center w-8 h-8"
                    title="Quick Add Task (Cmd+N)"
                  >
                    {isAddingTaskInline ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>

                {/* Add task Drawer slider */}
                <AnimatePresence>
                  {isAddingTaskInline && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto', transitionEnd: { overflow: 'visible' } }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`px-4 pt-3 pb-8 flex flex-col space-y-3 ${
                        isDarkMode ? 'bg-neutral-900/40' : 'bg-neutral-50/40'
                      }`}
                    >
                      <form onSubmit={handleAddNewTask} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="I want to do..."
                            value={quickTitle}
                            onChange={(e) => setQuickTitle(e.target.value)}
                            className={`px-3 py-2 text-xs rounded-lg outline-none ${
                              isDarkMode ? 'bg-neutral-850 text-white' : 'bg-neutral-100 text-neutral-800'
                            }`}
                            required
                            autoFocus
                          />

                          <div className="grid grid-cols-3 gap-2">
                            {/* Start Time scheduler */}
                            <input
                              type="text"
                              placeholder="Starts index (e.g. 14:00)"
                              value={quickStartTime}
                              onChange={(e) => setQuickStartTime(e.target.value)}
                              className={`px-2 py-2 text-xs text-center rounded-lg outline-none font-mono ${
                                isDarkMode ? 'bg-neutral-850 text-white' : 'bg-neutral-100 text-neutral-800'
                              }`}
                            />

                            {/* Duration estimation */}
                            <input
                              type="number"
                              placeholder="Minutes (e.g. 25)"
                              value={quickDuration}
                              onChange={(e) => setQuickDuration(e.target.value)}
                              className={`px-2 py-2 text-xs text-center rounded-lg outline-none font-mono ${
                                isDarkMode ? 'bg-neutral-850 text-white' : 'bg-neutral-100 text-neutral-800'
                              }`}
                              min="1"
                              max="300"
                            />

                            {/* Priority Selection */}
                            <div className="relative inline-flex items-center w-full">
                              <select
                                value={quickPriority}
                                onChange={(e) => setQuickPriority(e.target.value as any)}
                                className={`appearance-none pl-2.5 pr-9 py-2 text-xs rounded-lg outline-none font-sans cursor-pointer w-full select-none ${
                                  isDarkMode ? 'bg-neutral-850 text-neutral-300' : 'bg-neutral-100 text-neutral-800'
                                }`}
                              >
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        {/* List Folder Choice */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] text-neutral-400">Classify:</span>
                            <div className="relative inline-flex items-center">
                              <select
                                value={quickListId}
                                onChange={(e) => setQuickListId(e.target.value)}
                                className={`appearance-none pl-2.5 pr-7 py-1.5 text-xs rounded-lg outline-none cursor-pointer font-medium select-none ${
                                  isDarkMode ? 'bg-neutral-850 text-neutral-300' : 'bg-neutral-100 text-neutral-800'
                                }`}
                              >
                                {lists.map(l => (
                                  <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                              </select>
                              <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => setIsAddingTaskInline(false)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                                isDarkMode ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'
                              }`}
                            >
                              Dismiss
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white cursor-pointer shadow-none"
                            >
                              Schedule Task
                            </button>
                          </div>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Chronology Scroll Timeline */}
                <div className="grow overflow-y-auto p-4 md:p-6 space-y-4">
                  {chronologyList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-400">
                      <Clock className="w-10 h-10 text-neutral-500 opacity-40 mb-3" />
                      <span className="text-sm font-semibold text-neutral-300">Quiet Day Ahead</span>
                      <span className="text-xs text-neutral-400 mt-1">No matching calendar sync events or tasks are scheduled.</span>
                    </div>
                  ) : (
                    chronologyList.map(({ type, timeValue, item }) => {
                      if (type === 'calendar') {
                        // Render Beautiful Calendar Event item
                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-xl border-l-4 transition-all duration-200 flex items-start justify-between ${
                              isDarkMode 
                                ? 'bg-indigo-950/15 border-l-indigo-500 hover:bg-indigo-950/20' 
                                : 'bg-indigo-50/50 border-l-indigo-500 hover:bg-indigo-50'
                            }`}
                          >
                             <div className="space-y-1.5 text-left">
                              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-normal px-2 py-0.5 rounded uppercase tracking-wider">
                                CALENDAR EVENT SYNC
                              </span>
                              <h4 className="text-sm font-semibold leading-tight">{item.title}</h4>
                              <p className="text-[11px] text-neutral-400 flex items-center space-x-1 font-mono">
                                <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span>
                                  {item.startTime.split('T')[1]?.substring(0, 5) || 'All Day'} - {item.endTime.split('T')[1]?.substring(0, 5)}
                                </span>
                                {item.location && (
                                  <span className="text-sky-500 font-normal flex items-center gap-1">
                                    <span>·</span>
                                    <span>📍 {item.location}</span>
                                  </span>
                                )}
                              </p>
                            </div>
                            <span className="text-[10px] text-neutral-400 font-normal px-2 py-1 rounded-full bg-neutral-500/10 shrink-0 capitalize">
                              {item.category}
                            </span>
                          </div>
                        );
                      } else {
                        // Render Task list row mapping
                        const task: Task = item;
                        const taskList = lists.find(l => l.id === task.listId);
                        const isCurrentlyFocusTask = focusQueueTask?.id === task.id;

                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTaskId(task.id)}
                            className={`p-3.5 rounded-xl flex items-center justify-between transition-all duration-200 cursor-pointer ${
                              selectedTaskId === task.id
                                ? 'bg-sky-500/10'
                                : isDarkMode ? 'bg-neutral-900/40 hover:bg-neutral-900/70' : 'bg-neutral-100 hover:bg-neutral-150/50 shadow-xs'
                            }`}
                          >
                            <div className="flex items-center space-x-3 text-left min-w-0">
                              {/* Toggle completion trigger */}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleTask(task.id); }}
                                className="p-1 cursor-pointer outline-none hover:bg-neutral-500/10 rounded-full"
                              >
                                {task.completed ? (
                                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-neutral-400 hover:text-sky-500" />
                                )}
                              </button>

                              <div className="min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className={`text-sm font-semibold transition-all ${
                                    task.completed 
                                      ? `line-through font-medium ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}` 
                                      : (isDarkMode ? 'text-neutral-100' : 'text-neutral-800')
                                  }`}>
                                    {task.title}
                                  </span>
                                  {isCurrentlyFocusTask && (
                                    <span className="text-[9px] bg-sky-500/15 text-sky-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 flex items-center space-x-1">
                                      <Sparkles className="w-2.5 h-2.5" />
                                      <span>UP NEXT</span>
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-2 mt-1 text-[11px] text-neutral-400">
                                  {task.startTime && (
                                    <span className="font-mono text-sky-500 bg-sky-500/10 px-1.5 py-0.5 rounded font-normal">
                                      {task.startTime}
                                    </span>
                                  )}
                                  {task.duration && (
                                    <span className="font-mono">{task.duration}m duration</span>
                                  )}
                                  {task.dueDate === TOMORROW_STR && (
                                    <span className="text-violet-400 font-bold">Tomorrow</span>
                                  )}
                                  {taskList && (
                                    <span className="text-[10px] text-stone-500 flex items-center space-x-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                                      <span>{taskList.name}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 shrink-0">
                              <span className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} title={`${task.priority} priority`} />
                              
                              <button
                                onClick={(e) => handleDeleteTask(task.id, e)}
                                className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 md:opacity-100 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer`}
                                title="Remove Task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                          </div>
                        );
                      }
                    })
                  )}
                </div>

              </div>

              {/* Sidebar Detail Inspect Column editing drawer inside Desktop Window */}
              <AnimatePresence mode="wait">
                {selectedTaskId && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 280 }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ type: "spring", stiffness: 140, damping: 20 }}
                    className={`h-full flex flex-col justify-between p-4 overflow-y-auto ${
                      isDarkMode ? 'bg-[#161616]' : 'bg-white'
                    }`}
                  >
                    {/* Detail Panel header */}
                    {(() => {
                      const task = tasks.find(t => t.id === selectedTaskId);
                      if (!task) return null;

                      return (
                        <div className="space-y-5 text-left h-full flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest">
                                Item
                              </span>
                              <button
                                onClick={() => setSelectedTaskId(null)}
                                className="p-1 hover:bg-neutral-500/10 rounded-full cursor-pointer"
                              >
                                <X className="w-4 h-4 text-neutral-400" />
                              </button>
                            </div>

                            {/* Title Editing block */}
                            <div>
                              <input
                                type="text"
                                value={task.title}
                                onChange={(e) => {
                                  handleUpdateTaskDetail({ ...task, title: e.target.value });
                                }}
                                className={`w-full font-bold text-sm tracking-tight pb-1 outline-none ${
                                  isDarkMode ? 'bg-transparent text-white' : 'bg-transparent text-neutral-850'
                                }`}
                              />
                            </div>

                            {/* Priority Selection details option */}
                            <div>
                              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                                Priority Level
                              </label>
                              <select
                                value={task.priority}
                                onChange={(e) => {
                                  handleUpdateTaskDetail({ ...task, priority: e.target.value as any });
                                }}
                                className={`w-full text-xs p-2 rounded-lg outline-none cursor-pointer ${
                                  isDarkMode ? 'bg-neutral-900 text-neutral-300' : 'bg-neutral-100 text-neutral-700'
                                }`}
                              >
                                <option value="low">Low priority</option>
                                <option value="medium">Medium priority</option>
                                <option value="high">High priority</option>
                              </select>
                            </div>

                            {/* Subtitle / Description text container */}
                            <div>
                              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                                Subtitle Banner
                              </label>
                              <input
                                type="text"
                                value={task.subtitle || ''}
                                placeholder="Core instructions..."
                                onChange={(e) => {
                                  handleUpdateTaskDetail({ ...task, subtitle: e.target.value });
                                }}
                                className={`w-full text-xs p-2 rounded-lg outline-none ${
                                  isDarkMode ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-800'
                                }`}
                              />
                            </div>

                            {/* Notes text block */}
                            <div>
                              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                                Focus Notes (Markdown context)
                              </label>
                              <textarea
                                value={task.notes || ''}
                                placeholder="Add custom notes or specifications regarding current goals..."
                                onChange={(e) => {
                                  handleUpdateTaskDetail({ ...task, notes: e.target.value });
                                }}
                                className={`w-full h-24 text-xs p-2 rounded-lg outline-none resize-none leading-relaxed ${
                                  isDarkMode ? 'bg-neutral-900 text-neutral-300' : 'bg-neutral-100 text-neutral-800'
                                }`}
                              />
                            </div>

                            {/* Duration tracking presets */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                                  Estimated
                                </label>
                                <input
                                  type="number"
                                  value={task.estimatedMinutes || 25}
                                  onChange={(e) => {
                                    handleUpdateTaskDetail({ ...task, estimatedMinutes: parseInt(e.target.value, 10) || 25 });
                                  }}
                                  className={`w-full text-xs p-2 rounded-lg font-mono text-center outline-none ${
                                    isDarkMode ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-800'
                                  }`}
                                  min="1"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                                  Scheduled slot
                                </label>
                                <input
                                  type="text"
                                  value={task.startTime || ''}
                                  placeholder="None"
                                  onChange={(e) => {
                                    handleUpdateTaskDetail({ ...task, startTime: e.target.value || undefined });
                                  }}
                                  className={`w-full text-xs p-2 rounded-lg font-mono text-center outline-none ${
                                    isDarkMode ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-800'
                                  }`}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Quick entry for focused meditation timer */}
                          <div className="space-y-2 pt-4">
                            <button
                              onClick={() => {
                                // Pin task to top, assign focus states, swap pane
                                const nextTasks = tasks.map(t => {
                                  if (t.id === task.id) {
                                    return { ...t, isSnoozed: false };
                                  }
                                  return t;
                                });
                                // place active task top of stack
                                const picked = nextTasks.find(t => t.id === task.id);
                                const remainder = nextTasks.filter(t => t.id !== task.id);
                                if (picked) {
                                  saveTasksToLocalStorage([picked, ...remainder]);
                                }
                                setActiveWindow('distraction');
                              }}
                              className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center shadow-md shadow-sky-500/10"
                            >
                              <span>Focus this task</span>
                            </button>

                            {googleUser && (
                              <button
                                onClick={() => handleExportTaskToGoogleCalendar(task)}
                                className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold cursor-pointer border border-emerald-500/20 hover:border-emerald-500/30 transition-all text-center flex items-center justify-center space-x-1"
                              >
                                <svg className="w-3.5 h-3.5 fill-emerald-400" viewBox="0 0 24 24">
                                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.47 1.617l2.427-2.427C17.31 1.57 14.93 1 12.24 1 6.578 1 2 5.578 2 11.24s4.578 10.24 10.24 10.24c5.918 0 10.15-4.16 10.15-10.24 0-.69-.06-1.35-.18-1.955H12.24z"/>
                                </svg>
                                <span>Export to Google Cal</span>
                              </button>
                            )}
                            
                            <button
                              onClick={(e) => { handleDeleteTask(task.id, e); }}
                              className="w-full py-2 bg-neutral-500/10 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg text-neutral-400 text-xs font-semibold cursor-pointer border border-transparent hover:border-rose-500/25 transition-all text-center block"
                            >
                              Archive Task
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

          {/* 2. Sonoma Distraction-Free Focal Widget Dashboard */}
          {activeWindow === 'distraction' && (
            <motion.div 
              key="focal-workspace"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className={`w-full max-w-6xl h-[680px] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden backdrop-blur-xl ${
                isDarkMode 
                  ? 'bg-[#161616] text-neutral-200' 
                  : 'bg-white text-neutral-800 shadow-slate-200/40'
              }`}
            >
              <FocusWidget 
                activeTask={focusQueueTask}
                onComplete={handleToggleTask}
                onSnooze={handleSnoozeFocusTask}
                isDarkMode={isDarkMode}
                onBack={() => setActiveWindow('app')}
                onAddTaskDirectly={handleAddTaskDirectly}
              />
            </motion.div>
          )}

          {/* 3. Sonoma DMG Packaging Installer Helper Module */}
          {activeWindow === 'dmg' && (
            <motion.div 
              key="dmg-workspace"
              className="w-full"
            >
              <DmgDownloadModal 
                isDarkMode={isDarkMode}
              />
            </motion.div>
          )}

          {/* 4. Settings View (Inline, Non-Modal) */}
          {activeWindow === 'settings' && (
            <motion.div 
              key="settings-workspace"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className={`w-full max-w-6xl h-[680px] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden backdrop-blur-xl ${
                isDarkMode 
                  ? 'bg-[#161616] text-neutral-200' 
                  : 'bg-white text-neutral-800 shadow-slate-200/40'
              }`}
            >
              <SettingsModal 
                shortcuts={shortcuts}
                onSaveShortcuts={(nextSc) => {
                  setShortcuts(nextSc);
                  localStorage.setItem('upnext_shortcuts', JSON.stringify(nextSc));
                  triggerSync();
                }}
                onClose={() => setActiveWindow('app')}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                googleUser={googleUser}
                onGoogleSignIn={handleGoogleSignIn}
                onGoogleSignOut={handleGoogleSignOut}
                soundEnabled={soundEnabled}
                setSoundEnabled={(val) => {
                  setSoundEnabled(val);
                  localStorage.setItem('upnext_sound_enabled', String(val));
                }}
                meetingEndChimeEnabled={meetingEndChimeEnabled}
                setMeetingEndChimeEnabled={(val) => {
                  setMeetingEndChimeEnabled(val);
                  localStorage.setItem('upnext_meeting_chime_enabled', String(val));
                }}
                ambientSound={ambientSound}
                setAmbientSound={(val) => {
                  setAmbientSound(val);
                  localStorage.setItem('upnext_ambient_sound', val);
                }}
                timerDuration={timerDuration}
                setTimerDuration={(val) => {
                  setTimerDuration(val);
                  localStorage.setItem('upnext_timer_duration', String(val));
                }}
                notificationsEnabled={notificationsEnabled}
                setNotificationsEnabled={(val) => {
                  setNotificationsEnabled(val);
                  localStorage.setItem('upnext_notifications_enabled', String(val));
                }}
                colorCategoriesEnabled={colorCategoriesEnabled}
                setColorCategoriesEnabled={(val) => {
                  setColorCategoriesEnabled(val);
                  localStorage.setItem('upnext_color_categories_enabled', String(val));
                }}
                onResetOnboarding={() => {
                  setActiveWindow('app');
                  localStorage.removeItem('upnext_onboarding_done');
                  setShowOnboarding(true);
                }}
              />
            </motion.div>
          )}

          {/* 5. Help & About View (Inline, Non-Modal) */}
          {activeWindow === 'help' && (
            <motion.div 
              key="help-workspace"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className={`w-full max-w-6xl h-[680px] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden backdrop-blur-xl ${
                isDarkMode 
                  ? 'bg-[#161616] text-neutral-200' 
                  : 'bg-white text-neutral-800 shadow-slate-200/40'
              }`}
            >
              <HelpAndAboutView 
                onClose={() => setActiveWindow('app')}
                isDarkMode={isDarkMode}
              />
            </motion.div>
          )}

        </AnimatePresence>

      </div>

      {/* Onboarding Wizard Portal overlay */}
      {showOnboarding && (
        <OnboardingModal 
          googleUser={googleUser}
          onGoogleSignIn={handleGoogleSignIn}
          onGoogleSignOut={handleGoogleSignOut}
          soundEnabled={soundEnabled}
          setSoundEnabled={(val) => {
            setSoundEnabled(val);
            localStorage.setItem('upnext_sound_enabled', String(val));
          }}
          ambientSound={ambientSound}
          setAmbientSound={(val) => {
            setAmbientSound(val);
            localStorage.setItem('upnext_ambient_sound', val);
          }}
          timerDuration={timerDuration}
          setTimerDuration={(val) => {
            setTimerDuration(val);
            localStorage.setItem('upnext_timer_duration', String(val));
          }}
          notificationsEnabled={notificationsEnabled}
          setNotificationsEnabled={(val) => {
            setNotificationsEnabled(val);
            localStorage.setItem('upnext_notifications_enabled', String(val));
          }}
          onClose={() => setShowOnboarding(false)}
          isDarkMode={isDarkMode}
        />
      )}

    </div>
  );
}
