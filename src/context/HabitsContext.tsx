import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { DayEntry, HabitData } from "@/types/habits";

const STORAGE_KEY = "lifegit-habits";

interface HabitsContextType {
  habits: HabitData;
  getEntry: (date: Date) => DayEntry | null;
  setEntry: (date: Date, entry: DayEntry) => void;
  getTotalScore: (date: Date) => number;
  getContributionLevel: (date: Date) => number;
  getDateKey: (date: Date) => string;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

export const HabitsProvider = ({ children }: { children: ReactNode }) => {
  const [habits, setHabits] = useState<HabitData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }, [habits]);

  const getDateKey = (date: Date): string => {
    // Use local timezone instead of UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
    return (
      (entry.workout ? 1 : 0) +
      (entry.eating ? 1 : 0) +
      (entry.reading ? 1 : 0) +
      (entry.sleep ? 1 : 0)
    );
  };

  const getContributionLevel = (date: Date): number => {
    const total = getTotalScore(date);
    if (total === 0) return 0;
    if (total === 1) return 1;
    if (total === 2) return 2;
    if (total === 3) return 3;
    if (total === 4) return 4;
    return 0;
  };

  return (
    <HabitsContext.Provider
      value={{
        habits,
        getEntry,
        setEntry,
        getTotalScore,
        getContributionLevel,
        getDateKey,
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitsContext);
  if (context === undefined) {
    throw new Error("useHabits must be used within a HabitsProvider");
  }
  return context;
};
