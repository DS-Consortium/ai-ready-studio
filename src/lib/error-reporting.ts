/**
 * Client-side error reporting and grouping.
 * Captures runtime errors and unhandled promise rejections.
 */

export interface ErrorReportGroup {
  id: string;
  message: string;
  stack?: string;
  source?: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  examples: Array<{ time: string; context?: Record<string, any> }>;
}

const ERROR_REPORT_STORAGE_KEY = "ai-ready-studio-error-groups";
const subscribers = new Set<(groups: ErrorReportGroup[]) => void>();
const groups = new Map<string, ErrorReportGroup>();

function serializeGroups() {
  try {
    const payload = Array.from(groups.values());
    window.sessionStorage.setItem(ERROR_REPORT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore session storage failures
  }
}

function hydrateGroups() {
  try {
    const raw = window.sessionStorage.getItem(ERROR_REPORT_STORAGE_KEY);
    if (!raw) return;
    const items = JSON.parse(raw) as ErrorReportGroup[];
    items.forEach((item) => groups.set(item.id, item));
  } catch {
    // ignore parse failures
  }
}

function notifySubscribers() {
  const value = Array.from(groups.values());
  for (const subscriber of subscribers) {
    subscriber(value);
  }
}

function getGroupKey(message: string, stack?: string) {
  return stack?.trim() || message;
}

export function reportError(error: unknown, context?: Record<string, any>) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : JSON.stringify(error || "Unknown error");
  const stack = error instanceof Error ? error.stack || undefined : undefined;
  const key = getGroupKey(message, stack);

  if (!groups.size) {
    hydrateGroups();
  }

  const now = new Date().toISOString();

  const existing = groups.get(key);
  if (existing) {
    existing.count += 1;
    existing.lastSeen = now;
    existing.examples.unshift({ time: now, context: context || {} });
    if (existing.examples.length > 5) {
      existing.examples = existing.examples.slice(0, 5);
    }
    groups.set(key, existing);
  } else {
    groups.set(key, {
      id: `${groups.size + 1}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      stack,
      source: context?.source,
      count: 1,
      firstSeen: now,
      lastSeen: now,
      examples: [{ time: now, context: context || {} }],
    });
  }

  serializeGroups();
  notifySubscribers();
  sendErrorReport({ message, stack, context, timestamp: now }).catch(() => {
    // swallow network failures
  });
}

export async function sendErrorReport(payload: {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: string;
}) {
  if (typeof window === "undefined") return;

  try {
    await fetch("/api/errors/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // ignore network failures
  }
}

export function getErrorGroups(): ErrorReportGroup[] {
  if (!groups.size) {
    hydrateGroups();
  }
  return Array.from(groups.values());
}

export function subscribeErrorGroups(handler: (groups: ErrorReportGroup[]) => void) {
  subscribers.add(handler);
  handler(getErrorGroups());
  return () => subscribers.delete(handler);
}
