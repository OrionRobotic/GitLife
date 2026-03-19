import {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { createGoal, getGoals, updateGoal, deleteGoal, getGoalPeriods, upsertGoalPeriod } from "@/services/goals";
import type { Goal, GoalType, GoalPeriod } from "@/types/database/Goal";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

function getCurrentPeriod(type: GoalType): { periodStart: string; periodEnd: string } {
  const today = new Date();
  if (type === "weekly") {
    return {
      periodStart: format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      periodEnd: format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    };
  }
  if (type === "monthly") {
    return {
      periodStart: format(startOfMonth(today), "yyyy-MM-dd"),
      periodEnd: format(endOfMonth(today), "yyyy-MM-dd"),
    };
  }
  // semester
  const month = today.getMonth() + 1; // 1-12
  if (month <= 6) {
    return {
      periodStart: format(new Date(today.getFullYear(), 0, 1), "yyyy-MM-dd"),
      periodEnd: format(new Date(today.getFullYear(), 5, 30), "yyyy-MM-dd"),
    };
  }
  return {
    periodStart: format(new Date(today.getFullYear(), 6, 1), "yyyy-MM-dd"),
    periodEnd: format(new Date(today.getFullYear(), 11, 31), "yyyy-MM-dd"),
  };
}

function isInCurrentPeriod(goal: Goal): boolean {
  const period = getCurrentPeriod(goal.type);
  return (
    goal.periodStart === period.periodStart &&
    goal.periodEnd === period.periodEnd
  );
}

function findPeriodField<K extends keyof GoalPeriod>(
  goalPeriods: GoalPeriod[],
  type: GoalType,
  field: K
): GoalPeriod[K] | string {
  const period = getCurrentPeriod(type);
  const found = goalPeriods.find(
    (p) =>
      p.type === type &&
      p.periodStart === period.periodStart &&
      p.periodEnd === period.periodEnd
  );
  return found?.[field] ?? "";
}

interface GoalsContextType {
  weeklyGoals: Goal[];
  monthlyGoals: Goal[];
  semesterGoals: Goal[];
  isLoading: boolean;
  addGoal: (title: string, type: GoalType) => Promise<void>;
  toggleGoal: (id: string, completed: boolean) => Promise<void>;
  editGoal: (id: string, title: string) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  weeklyPeriodTitle: string;
  monthlyPeriodTitle: string;
  semesterPeriodTitle: string;
  weeklyPeriodDescription: string;
  monthlyPeriodDescription: string;
  semesterPeriodDescription: string;
  updatePeriod: (type: GoalType, updates: { title: string; description: string }) => Promise<void>;
}

export const GoalsContext = createContext<GoalsContextType | undefined>(
  undefined
);

export const GoalsProvider = ({ children }: { children: ReactNode }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalPeriods, setGoalPeriods] = useState<GoalPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [goalsData, periodsData] = await Promise.all([getGoals(), getGoalPeriods()]);
      if (goalsData) setGoals(goalsData);
      if (periodsData) setGoalPeriods(periodsData);
    } catch (error) {
      console.error("Error loading goals data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const weeklyGoals = goals.filter(
    (g) => g.type === "weekly" && isInCurrentPeriod(g)
  );
  const monthlyGoals = goals.filter(
    (g) => g.type === "monthly" && isInCurrentPeriod(g)
  );
  const semesterGoals = goals.filter(
    (g) => g.type === "semester" && isInCurrentPeriod(g)
  );

  const weeklyPeriodTitle = findPeriodField(goalPeriods, "weekly", "title") as string;
  const monthlyPeriodTitle = findPeriodField(goalPeriods, "monthly", "title") as string;
  const semesterPeriodTitle = findPeriodField(goalPeriods, "semester", "title") as string;
  const weeklyPeriodDescription = findPeriodField(goalPeriods, "weekly", "description") as string;
  const monthlyPeriodDescription = findPeriodField(goalPeriods, "monthly", "description") as string;
  const semesterPeriodDescription = findPeriodField(goalPeriods, "semester", "description") as string;

  const addGoal = async (title: string, type: GoalType) => {
    if (!user) return;
    const period = getCurrentPeriod(type);
    const newGoal = await createGoal(
      { title, type, ...period },
      user.id
    );
    if (newGoal) setGoals((prev) => [...prev, newGoal]);
  };

  const toggleGoal = async (id: string, completed: boolean) => {
    const updated = await updateGoal(id, { completed });
    if (updated) {
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    }
  };

  const editGoal = async (id: string, title: string) => {
    const updated = await updateGoal(id, { title });
    if (updated) {
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    }
  };

  const removeGoal = async (id: string) => {
    const success = await deleteGoal(id);
    if (success) setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const updatePeriod = async (type: GoalType, updates: { title: string; description: string }) => {
    if (!user) return;
    const period = getCurrentPeriod(type);
    const updated = await upsertGoalPeriod({ type, ...period, ...updates }, user.id);
    if (updated) {
      setGoalPeriods((prev) => {
        const idx = prev.findIndex(
          (p) =>
            p.type === type &&
            p.periodStart === period.periodStart &&
            p.periodEnd === period.periodEnd
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });
    }
  };

  return (
    <GoalsContext.Provider
      value={{
        weeklyGoals,
        monthlyGoals,
        semesterGoals,
        isLoading,
        addGoal,
        toggleGoal,
        editGoal,
        removeGoal,
        weeklyPeriodTitle,
        monthlyPeriodTitle,
        semesterPeriodTitle,
        weeklyPeriodDescription,
        monthlyPeriodDescription,
        semesterPeriodDescription,
        updatePeriod,
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
};
