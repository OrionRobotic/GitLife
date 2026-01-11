import { useState, useEffect } from "react";

export interface DayEntry {
  workout: number;
  eating: number;
  reading: number;
  sleep: number;
}

export interface HabitData {
  [date: string]: DayEntry;
}

const STORAGE_KEY = "lifegit-habits";

export const useHabits = () => {
  const [habits, setHabits] = useState<HabitData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }, [habits]);

  const getDateKey = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const getEntry = (date: Date): DayEntry | null => {
    return habits[getDateKey(date)] || null;
  };

  const setEntry = (date: Date, entry: DayEntry) => {
    setHabits((prev) => ({
      ...prev,
      [getDateKey(date)]: entry,
    }));
  };

  const getTotalScore = (date: Date): number => {
    const entry = getEntry(date);
    if (!entry) return 0;
    return (entry.workout ? 1 : 0) + (entry.eating ? 1 : 0) + (entry.reading ? 1 : 0);
  };

  const getContributionLevel = (date: Date): number => {
    const total = getTotalScore(date);
    if (total === 0) return 0;
    if (total === 1) return 1;
    if (total === 2) return 2;
    if (total === 3) return 3;
    return 0;
  };

  return {
    habits,
    getEntry,
    setEntry,
    getTotalScore,
    getContributionLevel,
    getDateKey,
  };
};
