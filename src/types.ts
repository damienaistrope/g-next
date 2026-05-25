/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Task {
  id: string;
  title: string;
  subtitle?: string;
  notes?: string;
  completed: boolean;
  listId: string;
  startTime?: string; // HH:MM
  duration?: number; // duration in minutes
  priority: 'low' | 'medium' | 'high';
  timeSpent: number; // in seconds
  estimatedMinutes?: number;
  dueDate?: string; // YYYY-MM-DD
  isSnoozed?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // ISO string or simple time like '2026-05-23T14:00:00'
  endTime: string;
  category: 'Work' | 'Personal' | 'Workspace Sync';
  color: string;
  location?: string;
  notes?: string;
}

export interface ListType {
  id: string;
  name: string;
  color: string; // tailwind color class prefix (e.g., 'blue', 'orange')
  iconName: string; // lucide icon name
}

export interface KeyboardShortcut {
  id: string;
  name: string;
  key: string;
  ctrlKey: boolean;
  metaKey: boolean; // Cmd on Mac
  altKey: boolean;  // Option on Mac
  shiftKey: boolean;
}

export interface CloudSyncState {
  status: 'synced' | 'syncing' | 'error' | 'offline';
  lastSyncedAt: string;
}
