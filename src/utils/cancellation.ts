/**
 * Helper to determine if a cancellation is within the late cancellation window (24 hours).
 * @param startTimeIso Appointment start time ISO string
 * @param now Reference time (default: current time)
 */
export function isLateCancellation(startTimeIso: string, now: Date = new Date()): boolean {
  const diffHours = (new Date(startTimeIso).getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours < 24;
}

/**
 * Returns the appropriate booking status after cancellation.
 * @param isLate Whether the cancellation is late
 */
export function getCancellationStatus(isLate: boolean): 'no_show' | 'cancelled_by_client' {
  return isLate ? 'no_show' : 'cancelled_by_client';
}
