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
import {
  Habit,
  HabitWithLogs as DatabaseHabitWithLogs,
} from "@/types/database";

interface HabitsContextType {
  databaseHabits: Habit[];
  visibleHabits: Array<{ id: string; name: string }>;
  refreshTrigger: number;
  getHabitsWithLogsForDate: (
    date: Date,
  ) => Promise<DatabaseHabitWithLogs[] | null>;
  updateHabitStatus: (
    habitName: string,
    completed: boolean,
    date?: Date,
  ) => Promise<void>;
  refreshVisibleHabits: () => Promise<void>;
}

export const HabitsContext = createContext<HabitsContextType | undefined>(
  undefined,
);

export const HabitsProvider = ({ children }: { children: ReactNode }) => {
  const [databaseHabits, setDatabaseHabits] = useState<Habit[]>([]);
  const [visibleHabits, setVisibleHabits] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
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
    date: Date = new Date(),
  ): Promise<void> => {
    if (!user) return;

    try {
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

      // Only refresh the database habits, not visible habits (they don't change)
      await loadAllHabitsFromDatabase();
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
        refreshTrigger,
        getHabitsWithLogsForDate,
        updateHabitStatus,
        refreshVisibleHabits,
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
};
