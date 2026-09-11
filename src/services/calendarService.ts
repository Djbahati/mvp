import axios from 'axios';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  recurrence?: string[];
  htmlLink?: string;
  status?: string;
  creator?: {
    email?: string;
    displayName?: string;
  };
  attendees?: Array<{
    email: string;
    responseStatus?: string;
  }>;
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  retryableStatuses?: number[];
}

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Ensures Google Calendar ID is a valid target API parameter.
 * Google Calendar API accepts 'primary', an email address, or a valid Google Calendar ID.
 * Custom category tokens like 'personal_finance', 'work_calendar', 'kofi_vault' must map to 'primary'.
 */
export function sanitizeCalendarId(calendarId?: string): string {
  if (!calendarId) return 'primary';
  const trimmed = calendarId.trim();
  if (trimmed === 'primary' || trimmed.includes('@') || trimmed.endsWith('.calendar.google.com')) {
    return trimmed;
  }
  return 'primary';
}

/**
 * Normalizes and sanitizes Google Calendar event payload to prevent 400 Bad Request errors.
 */
export function sanitizeCalendarEventPayload(eventData: CalendarEvent): any {
  let startIso: string;
  let endIso: string;

  // 1. Validate start date
  if (eventData.start?.dateTime) {
    const d = new Date(eventData.start.dateTime);
    startIso = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } else if (eventData.start?.date) {
    const d = new Date(eventData.start.date);
    startIso = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } else {
    startIso = new Date().toISOString();
  }

  // 2. Validate end date
  if (eventData.end?.dateTime) {
    const d = new Date(eventData.end.dateTime);
    endIso = isNaN(d.getTime()) ? new Date(new Date(startIso).getTime() + 3600000).toISOString() : d.toISOString();
  } else if (eventData.end?.date) {
    const d = new Date(eventData.end.date);
    endIso = isNaN(d.getTime()) ? new Date(new Date(startIso).getTime() + 3600000).toISOString() : d.toISOString();
  } else {
    endIso = new Date(new Date(startIso).getTime() + 3600000).toISOString();
  }

  // Ensure end > start (Google API returns HTTP 400 if end <= start)
  if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
    endIso = new Date(new Date(startIso).getTime() + 3600000).toISOString();
  }

  // Resolve user local system timezone or default to UTC/Africa/Kigali
  const resolvedTimeZone =
    eventData.start?.timeZone ||
    eventData.end?.timeZone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    'UTC';

  const payload: any = {
    summary: (eventData.summary || 'Kofi Wallet Reminder').trim(),
    start: {
      dateTime: startIso,
      timeZone: resolvedTimeZone
    },
    end: {
      dateTime: endIso,
      timeZone: resolvedTimeZone
    }
  };

  if (eventData.description) {
    payload.description = eventData.description.trim();
  }
  if (eventData.location) {
    payload.location = eventData.location.trim();
  }

  // Validate recurrence rules (RFC 5545 format)
  if (eventData.recurrence && Array.isArray(eventData.recurrence) && eventData.recurrence.length > 0) {
    const validRules = eventData.recurrence
      .filter((r) => typeof r === 'string' && r.trim().length > 0)
      .map((r) => {
        const trimmed = r.trim().toUpperCase();
        return trimmed.startsWith('RRULE:') ? trimmed : `RRULE:${trimmed}`;
      });
    if (validRules.length > 0) {
      payload.recurrence = validRules;
    }
  }

  return payload;
}

/**
 * Detailed error logger and message formatter for Google Calendar API responses.
 */
export function formatCalendarApiError(err: any, context: string): string {
  if (err.response) {
    const status = err.response.status;
    const statusText = err.response.statusText || 'Error';
    const googleError = err.response.data?.error;
    const message = googleError?.message || (typeof err.response.data === 'string' ? err.response.data : 'API request failed');
    const detailsList = googleError?.errors
      ? googleError.errors.map((e: any) => `[Reason: ${e.reason || 'unknown'}, Location: ${e.location || 'body'}] ${e.message}`).join('; ')
      : '';

    const fullMessage = `[Google Calendar API HTTP ${status} ${statusText}] ${context}: ${message}${detailsList ? ` | Details: ${detailsList}` : ''}`;

    console.error(fullMessage, {
      status,
      statusText,
      url: err.config?.url,
      method: err.config?.method,
      requestData: err.config?.data,
      responseData: err.response.data
    });

    return `HTTP ${status} (${statusText}): ${message}${detailsList ? ` - ${detailsList}` : ''}`;
  } else if (err.request) {
    const msg = `[Google Calendar API Network Failure] ${context}: Request sent but no response received from Google servers.`;
    console.error(msg, err.request);
    return `Network Error: Google Calendar server unreachable or request timed out.`;
  } else {
    const msg = `[Google Calendar Client Error] ${context}: ${err.message || 'Unknown exception'}`;
    console.error(msg, err);
    return err.message || 'An unexpected client error occurred.';
  }
}

/**
 * Executes an async API function with exponential backoff and jitter for transient errors and retries.
 */
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  logLabel: string = 'Google Calendar API'
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 800;
  const backoffFactor = options.backoffFactor ?? 2;
  const retryableStatuses = options.retryableStatuses ?? [400, 408, 429, 500, 502, 503, 504];

  let lastError: any;
  let currentDelay = initialDelayMs;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      if (attempt > 1) {
        console.info(`[Sync Retry] ${logLabel} - Executing retry attempt ${attempt - 1}/${maxRetries}...`);
      }
      return await fn();
    } catch (err: any) {
      lastError = err;
      const status = err.response?.status;
      const isRetryable =
        !status || // network error
        retryableStatuses.includes(status) ||
        attempt <= maxRetries;

      if (attempt <= maxRetries && isRetryable) {
        // Calculate delay with full randomized jitter (0-250ms)
        const jitter = Math.random() * 250;
        const sleepTime = Math.round(currentDelay + jitter);

        console.warn(
          `[Backoff Retry] ${logLabel} failed on attempt ${attempt}/${maxRetries + 1} (Status: ${
            status || 'Network Error'
          }). Retrying in ${sleepTime}ms...`,
          err.response?.data?.error?.message || err.message
        );

        await new Promise((resolve) => setTimeout(resolve, sleepTime));
        currentDelay *= backoffFactor;
      } else {
        break;
      }
    }
  }

  throw lastError;
}

/**
 * Fetch list of upcoming events from user's primary calendar with exponential backoff
 */
export async function listCalendarEvents(
  accessToken: string,
  maxResults: number = 20,
  options?: RetryOptions
): Promise<CalendarEvent[]> {
  return withExponentialBackoff(
    async () => {
      try {
        const now = new Date().toISOString();
        const url = `${CALENDAR_API_BASE}/calendars/primary/events?timeMin=${encodeURIComponent(
          now
        )}&singleEvents=true&orderBy=startTime&maxResults=${maxResults}`;

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        return response.data.items || [];
      } catch (err: any) {
        const detail = formatCalendarApiError(err, 'listCalendarEvents');
        throw new Error(detail);
      }
    },
    options,
    'listCalendarEvents'
  );
}

/**
 * Create a new event in Google Calendar with sanitization and exponential backoff
 */
export async function createCalendarEvent(
  accessToken: string,
  eventData: CalendarEvent,
  calendarId: string = 'primary',
  options?: RetryOptions
): Promise<CalendarEvent> {
  const targetCalendar = sanitizeCalendarId(calendarId);
  const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(targetCalendar)}/events`;
  const payload = sanitizeCalendarEventPayload(eventData);

  return withExponentialBackoff(
    async () => {
      try {
        const response = await axios.post(url, payload, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        return response.data;
      } catch (err: any) {
        const detail = formatCalendarApiError(err, `createCalendarEvent(calendar: "${targetCalendar}")`);
        throw new Error(detail);
      }
    },
    options,
    `createCalendarEvent(${payload.summary})`
  );
}

/**
 * Update an existing event in Google Calendar with sanitization and exponential backoff
 */
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  eventData: CalendarEvent,
  options?: RetryOptions
): Promise<CalendarEvent> {
  const url = `${CALENDAR_API_BASE}/calendars/primary/events/${encodeURIComponent(eventId)}`;
  const payload = sanitizeCalendarEventPayload(eventData);

  return withExponentialBackoff(
    async () => {
      try {
        const response = await axios.put(url, payload, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        return response.data;
      } catch (err: any) {
        const detail = formatCalendarApiError(err, `updateCalendarEvent(eventId: "${eventId}")`);
        throw new Error(detail);
      }
    },
    options,
    `updateCalendarEvent(${eventId})`
  );
}

/**
 * Delete an event from primary Google Calendar with exponential backoff
 */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
  options?: RetryOptions
): Promise<void> {
  const url = `${CALENDAR_API_BASE}/calendars/primary/events/${encodeURIComponent(eventId)}`;

  return withExponentialBackoff(
    async () => {
      try {
        await axios.delete(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
      } catch (err: any) {
        const detail = formatCalendarApiError(err, `deleteCalendarEvent(eventId: "${eventId}")`);
        throw new Error(detail);
      }
    },
    options,
    `deleteCalendarEvent(${eventId})`
  );
}
