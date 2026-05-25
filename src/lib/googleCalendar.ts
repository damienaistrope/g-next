/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalendarEvent } from '../types';

export async function fetchGoogleCalendarEvents(accessToken: string): Promise<CalendarEvent[]> {
  const now = new Date();
  
  // Set window from start of today to end of tomorrow (UTC focus)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 23, 59, 59);

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.append('timeMin', todayStart.toISOString());
  url.searchParams.append('timeMax', tomorrowEnd.toISOString());
  url.searchParams.append('singleEvents', 'true');
  url.searchParams.append('orderBy', 'startTime');
  url.searchParams.append('maxResults', '50');

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Google Calendar API call failed: ${response.status} - ${errorDetails}`);
  }

  const data = await response.json();
  const items = data.items || [];

  return items.map((item: any) => {
    const startTimeRaw = item.start?.dateTime || item.start?.date;
    const endTimeRaw = item.end?.dateTime || item.end?.date;
    
    // Assign simple display colors
    const colors = ['sky', 'indigo', 'emerald', 'amber', 'rose'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    return {
      id: item.id,
      title: item.summary || 'Untitled Event',
      startTime: startTimeRaw,
      endTime: endTimeRaw,
      category: 'Calendar Sync' as const,
      color: randomColor,
      location: item.location,
      notes: item.description
    };
  });
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  event: Omit<CalendarEvent, 'id' | 'category' | 'color'>
): Promise<CalendarEvent> {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  
  const payload = {
    summary: event.title,
    location: event.location,
    description: event.notes,
    start: {
      dateTime: event.startTime,
    },
    end: {
      dateTime: event.endTime,
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Failed to create Google Calendar event: ${response.status} - ${errorDetails}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    title: data.summary || 'Untitled Event',
    startTime: data.start?.dateTime || data.start?.date,
    endTime: data.end?.dateTime || data.end?.date,
    category: 'Workspace Sync' as const,
    color: 'emerald',
    location: data.location,
    notes: data.description
  };
}
