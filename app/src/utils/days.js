import { WEEK_DAYS } from '../constants/days';

// JavaScript's getDay() starts the week on Sunday (0). WEEK_DAYS starts on Monday.
export function getTodayName() {
  const mondayBasedIndex = (new Date().getDay() + 6) % 7;
  return WEEK_DAYS[mondayBasedIndex];
}

export function getShortDayName(day) {
  return day.slice(0, 3);
}
