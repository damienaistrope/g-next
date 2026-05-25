/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, CalendarEvent, ListType, KeyboardShortcut } from './types';

export const INITIAL_LISTS: ListType[] = [
  { id: 'inbox', name: 'Inbox', color: 'indigo', iconName: 'Inbox' },
  { id: 'work', name: 'Work', color: 'sky', iconName: 'Briefcase' },
  { id: 'personal', name: 'Personal', color: 'emerald', iconName: 'User' },
  { id: 'learning', name: 'Leisure & Growth', color: 'violet', iconName: 'BookOpen' },
];

export const INITIAL_TASKS = (todayStr: string, tomorrowStr: string): Task[] => [
  {
    id: 'task-1',
    title: 'Deploy Sonoma App Store build release',
    subtitle: 'Ensure double sandboxing works on M1 ultra tests',
    notes: 'Google staffing build requires notarization with team credentials.',
    completed: false,
    listId: 'work',
    priority: 'high',
    startTime: '23:15',
    duration: 30,
    timeSpent: 240,
    estimatedMinutes: 30,
    dueDate: todayStr,
  },
  {
    id: 'task-2',
    title: 'Prepare breakfast and coffee beans',
    subtitle: 'Set up light roast beans for morning drip',
    notes: 'Grind size 18, water temperature 93 degrees C.',
    completed: false,
    listId: 'personal',
    priority: 'low',
    startTime: '23:45',
    duration: 10,
    timeSpent: 0,
    estimatedMinutes: 10,
    dueDate: todayStr,
  },
  {
    id: 'task-3',
    title: 'Merge pending pull requests',
    subtitle: 'Core animation transition utilities',
    notes: 'Check for any performance degradation on older machines.',
    completed: true,
    listId: 'work',
    priority: 'medium',
    startTime: '21:00',
    duration: 45,
    timeSpent: 2700,
    estimatedMinutes: 45,
    dueDate: todayStr,
  },
  {
    id: 'task-4',
    title: 'Sync with Mac Admin team',
    subtitle: 'Discuss private corporate DMG signing profiles',
    notes: 'Verify MDM distribution pipelines for Google corporate profiles.',
    completed: false,
    listId: 'work',
    priority: 'high',
    startTime: '10:00',
    duration: 30,
    timeSpent: 0,
    estimatedMinutes: 30,
    dueDate: tomorrowStr,
  },
  {
    id: 'task-5',
    title: 'Refactor state store container to hook pattern',
    subtitle: 'Optimize for Swift-like render pipeline in web browser',
    notes: 'Minimize unnecessary re-renders in the main list viewer.',
    completed: false,
    listId: 'inbox',
    priority: 'medium',
    startTime: '11:30',
    duration: 90,
    timeSpent: 0,
    estimatedMinutes: 90,
    dueDate: tomorrowStr,
  },
  {
    id: 'task-6',
    title: 'Weekly mindfulness journaling session',
    subtitle: 'Calm reflection and tracking personal velocity',
    notes: 'Write in markdown journal container in ~/Documents/Logs/Diary.md',
    completed: false,
    listId: 'learning',
    priority: 'low',
    startTime: '22:00',
    duration: 20,
    timeSpent: 0,
    estimatedMinutes: 20,
    dueDate: tomorrowStr,
  }
];

export const INITIAL_CALENDAR_EVENTS = (todayStr: string, tomorrowStr: string): CalendarEvent[] => [
  {
    id: 'cal-1',
    title: 'Staffing Alignment Sync',
    startTime: `${todayStr}T23:00:00`,
    endTime: `${todayStr}T23:30:00`,
    category: 'Work',
    color: 'sky',
    location: 'Google Meet (meet.google.com/abc-defg-hij)',
    notes: 'Aligning Sonoma native app compilation timeline for Google employees.',
  },
  {
    id: 'cal-2',
    title: 'Workspace Sync Verification Window',
    startTime: `${todayStr}T23:45:00`,
    endTime: `${todayStr}T23:59:59`,
    category: 'Workspace Sync',
    color: 'emerald',
    notes: 'Verifying concurrent edits on desktop and cloud workspace clients.',
  },
  {
    id: 'cal-3',
    title: 'Architecture Sync: Shared Core Engine',
    startTime: `${tomorrowStr}T09:00:00`,
    endTime: `${tomorrowStr}T10:00:00`,
    category: 'Work',
    color: 'indigo',
    location: '111 Eighth Ave, Manhattan / Room 4C',
  },
  {
    id: 'cal-4',
    title: 'Personal Training Routine',
    startTime: `${tomorrowStr}T18:00:00`,
    endTime: `${tomorrowStr}T19:00:00`,
    category: 'Personal',
    color: 'violet',
    location: 'Equinox Gym Hudson Yards',
  }
];

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { id: 'quick-add', name: 'Toggle Quick New Task Picker', key: 'N', ctrlKey: false, metaKey: true, altKey: false, shiftKey: false },
  { id: 'toggle-distraction', name: 'Focus/Distraction-Free Mode', key: 'D', ctrlKey: false, metaKey: true, altKey: false, shiftKey: false },
  { id: 'search', name: 'Focus App Command Search Bar', key: 'K', ctrlKey: false, metaKey: true, altKey: false, shiftKey: false },
  { id: 'trigger-sync', name: 'Trigger Manual Cloud Backup Sync', key: 'S', ctrlKey: false, metaKey: true, altKey: true, shiftKey: false },
  { id: 'toggle-dark', name: 'Toggle Sonoma Color Interface Theme', key: 'L', ctrlKey: false, metaKey: true, altKey: false, shiftKey: false }
];
