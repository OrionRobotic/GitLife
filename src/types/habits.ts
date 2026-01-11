export interface DayEntry {
  workout: number;
  eating: number;
  reading: number;
  sleep: number;
}

export interface HabitData {
  [date: string]: DayEntry;
}