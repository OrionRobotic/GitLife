import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import {
  createHabit,
  getHabitsForUser,
  getVisibleHabits,
  addHabitLogForToday,
  removeHabitLogForToday,
  addHabitLogForDate,
  removeHabitLogForDate,
} from "@/services/habits";
import { format } from "date-fns";
import {
  Habit,
  HabitWithLogs as DatabaseHabitWithLogs,
} from "@/types/database";

interface HabitsContextType {
  databaseHabits: Habit[];
  visibleHabits: Array<{ id: string; name: string }>;
  allHabitLogs: any[];
  todaysCompletedHabitIds: Set<string>;
  refreshTrigger: number;
  isLoading: boolean;
  getHabitsWithLogsForDate: (
    date: Date
  ) => Promise<DatabaseHabitWithLogs[] | null>;
  updateHabitStatus: (
    habitName: string,
    completed: boolean,
    date?: Date
  ) => Promise<void>;
  refreshVisibleHabits: () => Promise<void>;
}

export const HabitsContext = createContext<HabitsContextType | undefined>(
  undefined
);

export const HabitsProvider = ({ children }: { children: ReactNode }) => {
  const [databaseHabits, setDatabaseHabits] = useState<Habit[]>([]);
  const [visibleHabits, setVisibleHabits] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [allHabitLogs, setAllHabitLogs] = useState<any[]>([]);
  const [todaysCompletedHabitIds, setTodaysCompletedHabitIds] = useState<
    Set<string>
  >(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<number | null>(
    null
  );
  const { user } = useAuth();

  const loadAllHabitsFromDatabase = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [habits, logs] = await Promise.all([
        getVisibleHabits(),
        getHabitsForUser(user.id),
      ]);

      if (habits) {
        setVisibleHabits(habits);
      }
      if (logs) {
        setAllHabitLogs(logs);
      }
      setLastFetchTimestamp(Date.now());
    } catch (error) {
      console.error("Error loading all habits from database:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refreshVisibleHabits = useCallback(async () => {
    if (!user) return;

    try {
      const habits = await getVisibleHabits();
      setVisibleHabits(habits);
    } catch (error) {
      console.error("Error refreshing visible habits:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const shouldFetch = !lastFetchTimestamp || refreshTrigger > 0;
      if (shouldFetch) {
        loadAllHabitsFromDatabase();
      }
    }
  }, [user, refreshTrigger, loadAllHabitsFromDatabase]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastFetchTimestamp) {
        const fiveMinutes = 5 * 60 * 1000;
        if (Date.now() - lastFetchTimestamp > fiveMinutes) {
          loadAllHabitsFromDatabase();
        }
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [lastFetchTimestamp, loadAllHabitsFromDatabase]);

  // Pre-calculate today's completed habits
  useEffect(() => {
    if (!allHabitLogs) {
      setTodaysCompletedHabitIds(new Set());
      return;
    }

    const todayStr = format(new Date(), "yyyyMMdd");
    const completedIds = new Set<string>();

    for (const log of allHabitLogs) {
      if (log.integerDate.toString() === todayStr) {
        completedIds.add(log.habitId);
      }
    }
    setTodaysCompletedHabitIds(completedIds);
  }, [allHabitLogs]);

  const getHabitsWithLogsForDate = useCallback(
    async (date: Date): Promise<DatabaseHabitWithLogs[] | null> => {
      if (!user) return null;

      try {
        if (databaseHabits.length === 0) {
          return [];
        }

        const habitsWithLogs: DatabaseHabitWithLogs[] = databaseHabits.map(
          (habit) => ({
            ...habit,
            logs: [],
          })
        );

        return habitsWithLogs;
      } catch (error) {
        console.error("Error fetching habits with logs:", error);
        return null;
      }
    },
    [user, databaseHabits]
  );

  const updateHabitStatus = async (
    habitName: string,
    completed: boolean,
    date: Date = new Date()
  ): Promise<void> => {
    if (!user) return;

    try {
      const allHabits = await getVisibleHabits();

      let habitId: string;

      const existingHabit = allHabits.find(
        (h) => h.name.toLowerCase() === habitName.toLowerCase()
      );

      if (existingHabit) {
        habitId = existingHabit.id;
      } else {
        throw new Error(`Habit "${habitName}" does not exist`);
      }

      if (completed) {
        const success = await addHabitLogForDate(habitId, user.id, date);
        if (!success) {
          throw new Error("Failed to add habit log");
        }
      } else {
        const success = await removeHabitLogForDate(habitId, user.id, date);
        if (!success) {
          throw new Error("Failed to remove habit log");
        }
      }

      // Trigger a refresh for components that depend on habit changes
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error updating habit status:", error);
      throw error;
    }
  };

  return (
    <HabitsContext.Provider
      value={{
        databaseHabits,
        visibleHabits,
        allHabitLogs,
        todaysCompletedHabitIds,
        refreshTrigger,
        isLoading,
        getHabitsWithLogsForDate,
        updateHabitStatus,
        refreshVisibleHabits,
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
};
