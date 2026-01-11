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
} from "@/services/habits";
import {
  Habit,
  HabitWithLogs as DatabaseHabitWithLogs,
} from "@/types/database";

interface HabitsContextType {
  databaseHabits: Habit[];
  visibleHabits: Array<{ id: string; name: string }>;
  getHabitsWithLogsForDate: (
    date: Date,
  ) => Promise<DatabaseHabitWithLogs[] | null>;
  updateHabitStatus: (
    habitName: string,
    completed: boolean,
  ) => Promise<boolean>;
  refreshVisibleHabits: () => Promise<void>;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

export const HabitsProvider = ({ children }: { children: ReactNode }) => {
  const [databaseHabits, setDatabaseHabits] = useState<Habit[]>([]);
  const [visibleHabits, setVisibleHabits] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const { user } = useAuth();

  const loadAllHabitsFromDatabase = useCallback(async () => {
    if (!user) return;

    try {
      const habits = await getHabitsForUser(user.id);
      if (habits) {
        setDatabaseHabits(habits);
      }
    } catch (error) {
      console.error("Error loading all habits from database:", error);
    }
  }, [user]);

  // Refresh visible habits from database
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
      loadAllHabitsFromDatabase();
      refreshVisibleHabits();
    }
  }, [user, loadAllHabitsFromDatabase, refreshVisibleHabits]);

  // Get habits with logs for a specific date
  const getHabitsWithLogsForDate = async (
    date: Date,
  ): Promise<DatabaseHabitWithLogs[] | null> => {
    if (!user) return null;

    try {
      const habits = await getHabitsForUser(user.id);
      if (!habits) return null;

      const habitsWithLogs: DatabaseHabitWithLogs[] = habits.map((habit) => ({
        ...habit,
        logs: [],
      }));

      return habitsWithLogs;
    } catch (error) {
      console.error("Error fetching habits with logs:", error);
      return null;
    }
  };

  const updateHabitStatus = async (
    habitName: string,
    completed: boolean,
  ): Promise<void> => {
    if (!user) return false;

    try {
      // Find habit from visibleHabits (which comes from habits table)
      const allHabits = await getVisibleHabits();

      let habitId: string;

      const existingHabit = allHabits.find(
        (h) => h.name.toLowerCase() === habitName.toLowerCase(),
      );

      if (existingHabit) {
        habitId = existingHabit.id;
      } else {
        throw new Error(`Habit "${habitName}" does not exist`);
      }

      if (completed) {
        const success = await addHabitLogForToday(habitId, user.id);
        if (!success) {
          throw new Error("Failed to add habit log for today");
        }
      } else {
        const success = await removeHabitLogForToday(habitId, user.id);
        if (!success) {
          throw new Error("Failed to remove habit log for today");
        }
      }

      await loadAllHabitsFromDatabase();
      await refreshVisibleHabits();
    } catch (error) {
      console.error("Error updating habit status:", error);
    }
  };

  return (
    <HabitsContext.Provider
      value={{
        databaseHabits,
        visibleHabits,
        getHabitsWithLogsForDate,
        updateHabitStatus,
        refreshVisibleHabits,
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
