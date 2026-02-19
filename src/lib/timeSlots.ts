import { getDateTimePartsInTimeZone } from '@/lib/utils';

/**
 * Time slot utilities for DSA Grinders cron jobs
 * Handles 30-minute time slot calculations and user scheduling
 */

export interface TimeSlot {
  hour: number;
  slotStart: number; // 0 or 30
  slotEnd: number;   // 30 or 60
  label: string;     // "09:00-09:30" or "09:30-10:00"
}

/**
 * Get the current 30-minute time slot
 */
export function getCurrentTimeSlot(timeZone?: string): TimeSlot {
  const { hour, minute } = getDateTimePartsInTimeZone(timeZone);

  const slotStart = minute < 30 ? 0 : 30;
  const slotEnd = slotStart + 30;

  const startLabel = `${hour.toString().padStart(2, '0')}:${slotStart.toString().padStart(2, '0')}`;
  const endLabel = slotEnd === 60
    ? `${(hour + 1).toString().padStart(2, '0')}:00`
    : `${hour.toString().padStart(2, '0')}:${slotEnd.toString().padStart(2, '0')}`;

  return {
    hour,
    slotStart,
    slotEnd,
    label: `${startLabel}-${endLabel}`
  };
}

/**
 * Check if a user's dailyGrindTime falls in the specified time slot
 */
export function isTimeInSlot(userTime: string | null, slot: TimeSlot): boolean {
  if (!userTime || !userTime.match(/^\d{2}:\d{2}$/)) return false;

  const [userHour, userMin] = userTime.split(':').map(Number);

  return userHour === slot.hour && userMin >= slot.slotStart && userMin < slot.slotEnd;
}

/**
 * Check if a user's dailyGrindTime falls in the current 30-minute slot
 */
export function isInCurrentTimeSlot(userTime: string | null, timeZone?: string): boolean {
  const currentSlot = getCurrentTimeSlot(timeZone);
  return isTimeInSlot(userTime, currentSlot);
}

/**
 * Get all 48 possible time slots in a day (30-minute intervals)
 */
export function getAllTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];

  for (let hour = 0; hour < 24; hour++) {
    // First half: XX:00-XX:30
    slots.push({
      hour,
      slotStart: 0,
      slotEnd: 30,
      label: `${hour.toString().padStart(2, '0')}:00-${hour.toString().padStart(2, '0')}:30`
    });

    // Second half: XX:30-XX+1:00
    const endHour = hour === 23 ? 0 : hour + 1;
    slots.push({
      hour,
      slotStart: 30,
      slotEnd: 60,
      label: `${hour.toString().padStart(2, '0')}:30-${endHour.toString().padStart(2, '0')}:00`
    });
  }

  return slots;
}

/**
 * Get time slots coming up in the next few hours
 */
export function getUpcomingSlots(count: number = 4): TimeSlot[] {
  const allSlots = getAllTimeSlots();
  const currentSlot = getCurrentTimeSlot();

  const currentIndex = allSlots.findIndex(slot =>
    slot.hour === currentSlot.hour && slot.slotStart === currentSlot.slotStart
  );

  if (currentIndex === -1) return allSlots.slice(0, count);

  const upcomingSlots: TimeSlot[] = [];
  for (let i = 1; i <= count; i++) {
    const index = (currentIndex + i) % allSlots.length;
    upcomingSlots.push(allSlots[index]);
  }

  return upcomingSlots;
}

/**
 * Parse a time string (HH:MM)
 */
export function parseTime(timeString: string): { hour: number; minute: number } | null {
  if (!timeString || !timeString.match(/^\d{2}:\d{2}$/)) {
    return null;
  }

  const [hour, minute] = timeString.split(':').map(Number);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

/**
 * Format a time slot for display
 */
export function formatTimeSlot(slot: TimeSlot): string {
  return `${slot.label} (${getSlotDescription(slot)})`;
}

function getSlotDescription(slot: TimeSlot): string {
  const hour = slot.hour;
  const isFirstHalf = slot.slotStart === 0;

  if (hour >= 6 && hour < 12) {
    return isFirstHalf ? 'Morning' : 'Late Morning';
  } else if (hour >= 12 && hour < 17) {
    return isFirstHalf ? 'Afternoon' : 'Late Afternoon';
  } else if (hour >= 17 && hour < 21) {
    return isFirstHalf ? 'Evening' : 'Late Evening';
  } else {
    return isFirstHalf ? 'Night' : 'Late Night';
  }
}

/**
 * Debug helper: get info about current time and slot
 */
export function getTimeSlotDebugInfo(timeZone?: string) {
  const nowParts = getDateTimePartsInTimeZone(timeZone);
  const currentSlot = getCurrentTimeSlot(timeZone);
  const upcomingSlots = getUpcomingSlots(3);

  return {
    currentTime: `${nowParts.year}-${nowParts.month.toString().padStart(2, '0')}-${nowParts.day.toString().padStart(2, '0')}T${nowParts.hour.toString().padStart(2, '0')}:${nowParts.minute.toString().padStart(2, '0')}`,
    localTime: `${nowParts.hour.toString().padStart(2, '0')}:${nowParts.minute.toString().padStart(2, '0')}`,
    currentSlot: formatTimeSlot(currentSlot),
    upcomingSlots: upcomingSlots.map(s => formatTimeSlot(s)),
    totalSlotsPerDay: 48
  };
}
