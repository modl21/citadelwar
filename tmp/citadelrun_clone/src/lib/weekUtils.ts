/**
 * Get the start of the current week (Monday 00:00 UTC)
 */
export function getCurrentWeekStart(): number {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday, 1 = Monday
  const daysSinceMonday = (day + 6) % 7;
  const start = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - daysSinceMonday,
    0, 0, 0, 0
  ));
  return Math.floor(start.getTime() / 1000);
}

/**
 * Get the end of the current week (next Monday 00:00 UTC)
 */
export function getCurrentWeekEnd(): number {
  const start = getCurrentWeekStart();
  return start + 7 * 24 * 60 * 60;
}

/**
 * Get the start of the previous week
 */
export function getPreviousWeekStart(): number {
  return getCurrentWeekStart() - 7 * 24 * 60 * 60;
}

/**
 * Get the end of the previous week (same as current week start)
 */
export function getPreviousWeekEnd(): number {
  return getCurrentWeekStart();
}

/**
 * Format a timestamp as a readable date
 */
export function formatTimestamp(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

/**
 * Get time remaining until next Monday 00:00 UTC
 */
export function getTimeUntilReset(): string {
  const endTs = getCurrentWeekEnd();
  const now = Math.floor(Date.now() / 1000);
  const diff = endTs - now;

  if (diff <= 0) return 'Resetting...';

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
