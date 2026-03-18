import {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import {
  createHabit,
  deleteHabit,
  getHabitsForUser,
  getVisibleHabits,
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
  visibleHabits: Array<{ id: string; name: string; icon?: string }>;
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
  createNewHabit: (name: string, icon?: string) => Promise<boolean>;
  removeHabit: (habitId: string) => Promise<boolean>;
}

export const HabitsContext = createContext<HabitsContextType | undefined>(
  undefined
);

export const HabitsProvider = ({ children }: { children: ReactNode }) => {
  const [databaseHabits, setDatabaseHabits] = useState<Habit[]>([]);
  const [visibleHabits, setVisibleHabits] = useState<
    Array<{ id: string; name: string; icon?: string }>
  >([]);
  const [allHabitLogs, setAllHabitLogs] = useState<any[]>([]);
  const [todaysCompletedHabitIds, setTodaysCompletedHabitIds] = useState<
    Set<string>
  >(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<number | null>(
    null
  );
  const { user } = useAuth();

  const loadAllHabitsFromDatabase = useCallback(
    async (silent = false) => {
      if (!user) return;

      if (!silent) {
        setIsLoading(true);
      }
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
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [user]
  );

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
        const isFirstLoad = lastFetchTimestamp === null;
        loadAllHabitsFromDatabase(!isFirstLoad);
      }
    }
  }, [user, refreshTrigger, loadAllHabitsFromDatabase]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastFetchTimestamp) {
        const fiveMinutes = 5 * 60 * 1000;
        if (Date.now() - lastFetchTimestamp > fiveMinutes) {
          loadAllHabitsFromDatabase(true);
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
      if (log.integerDate && log.integerDate.toString() === todayStr) {
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

      const existingHabit = allHabits.find(
        (h) => h.name.toLowerCase() === habitName.toLowerCase()
      );

      if (!existingHabit) {
        throw new Error(`Habit "${habitName}" does not exist`);
      }

      if (completed) {
        const success = await addHabitLogForDate(existingHabit.id, user.id, date);
        if (!success) throw new Error("Failed to add habit log");
      } else {
        const success = await removeHabitLogForDate(existingHabit.id, user.id, date);
        if (!success) throw new Error("Failed to remove habit log");
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error updating habit status:", error);
      throw error;
    }
  };

  const createNewHabit = async (name: string, icon?: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const result = await createHabit({ name, icon }, user.id);
      if (result) {
        const capitalizedName =
          result.name.charAt(0).toUpperCase() + result.name.slice(1).toLowerCase();
        setVisibleHabits((prev) => [
          ...prev,
          { id: result.id, name: capitalizedName, icon: result.icon },
        ]);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error creating habit:", error);
      return false;
    }
  };

  const removeHabit = async (habitId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const success = await deleteHabit(habitId, user.id);
      if (success) {
        setVisibleHabits((prev) => prev.filter((h) => h.id !== habitId));
        setAllHabitLogs((prev) => prev.filter((log) => log.habitId !== habitId));
      }
      return success;
    } catch (error) {
      console.error("Error deleting habit:", error);
      return false;
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
        createNewHabit,
        removeHabit,
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
};
