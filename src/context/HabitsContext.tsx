import {
  createContext,
  useContext,
  useState,
  useEffect,
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

  useEffect(() => {
    if (user) {
      loadAllHabitsFromDatabase();
      refreshVisibleHabits();
    }
  }, [user, loadAllHabitsFromDatabase, refreshVisibleHabits]);

  const loadAllHabitsFromDatabase = async () => {
    if (!user) return;

    try {
      const habits = await getHabitsForUser(user.id);
      if (habits) {
        setDatabaseHabits(habits);
      }
    } catch (error) {
      console.error("Error loading all habits from database:", error);
    }
  };

  // Refresh visible habits from database
  const refreshVisibleHabits = async () => {
    if (!user) return;

    try {
      const habits = await getVisibleHabits(user.id);
      setVisibleHabits(habits);
    } catch (error) {
      console.error("Error refreshing visible habits:", error);
    }
  };

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
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const habits = await getHabitsForUser(user.id);
      if (!habits) return false;

      const habit = habits.find(
        (h) => h.name.toLowerCase() === habitName.toLowerCase(),
      );
      if (!habit) {
        const newHabit = await createHabit({ name: habitName }, user.id);
        if (!newHabit) return false;
        habit.id = newHabit.id;
      }

      if (completed) {
        const success = await addHabitLogForToday(habit.id, user.id);
        if (!success) {
          console.error("Failed to add habit log for today");
          return false;
        }
      } else {
        const success = await removeHabitLogForToday(habit.id, user.id);
        if (!success) {
          console.error("Failed to remove habit log for today");
          return false;
        }
      }

      await loadAllHabitsFromDatabase();
      await refreshVisibleHabits();

      return true;
    } catch (error) {
      console.error("Error updating habit status:", error);
      return false;
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
