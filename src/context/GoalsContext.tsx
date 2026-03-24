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
  addMonths,
  subDays,
  parseISO,
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
    // Default to a 4-month period starting from the first of the current month
    const start = startOfMonth(today);
    return {
      periodStart: format(start, "yyyy-MM-dd"),
      periodEnd: format(subDays(addMonths(start, 4), 1), "yyyy-MM-dd"),
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

export interface QuarterEffortEntry {
  goalId: string | null;
  percentage: number;
  count: number;
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
  linkGoal: (id: string, linkedGoalId: string | null) => Promise<void>;
  weeklyPeriodTitle: string;
  monthlyPeriodTitle: string;
  semesterPeriodTitle: string;
  weeklyPeriodDescription: string;
  monthlyPeriodDescription: string;
  semesterPeriodDescription: string;
  updatePeriod: (type: GoalType, updates: { title: string; description: string }) => Promise<void>;
  updateMonthlyPeriodStart: (startDate: string) => Promise<void>;
  monthlyPeriodStart: string;
  monthlyPeriodEnd: string;
  quarterEffort: QuarterEffortEntry[];
  quarterWeeklyGoals: Goal[];
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

  // Derive the active monthly period from stored goal_periods (custom start date support)
  // Only consider periods with at least 60 days (4-month quarters) — ignores old 1-month records
  const activeMonthlyPeriod = (() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const stored = goalPeriods
      .filter((p) => {
        if (p.type !== "monthly") return false;
        const days = (new Date(p.periodEnd).getTime() - new Date(p.periodStart).getTime()) / 86400000;
        return days >= 60;
      })
      .sort((a, b) => b.periodStart.localeCompare(a.periodStart));
    const current = stored.find((p) => p.periodStart <= today && p.periodEnd >= today);
    if (current) return { periodStart: current.periodStart, periodEnd: current.periodEnd };
    if (stored.length > 0) return { periodStart: stored[0].periodStart, periodEnd: stored[0].periodEnd };
    return getCurrentPeriod("monthly");
  })();

  const weeklyGoals = goals.filter(
    (g) => g.type === "weekly" && isInCurrentPeriod(g)
  );
  const monthlyGoals = goals.filter(
    (g) =>
      g.type === "monthly" &&
      g.periodStart === activeMonthlyPeriod.periodStart &&
      g.periodEnd === activeMonthlyPeriod.periodEnd
  );
  const semesterGoals = goals.filter(
    (g) => g.type === "semester" && isInCurrentPeriod(g)
  );

  const weeklyPeriodTitle = findPeriodField(goalPeriods, "weekly", "title") as string;
  const semesterPeriodTitle = findPeriodField(goalPeriods, "semester", "title") as string;
  const weeklyPeriodDescription = findPeriodField(goalPeriods, "weekly", "description") as string;
  const semesterPeriodDescription = findPeriodField(goalPeriods, "semester", "description") as string;
  // Monthly uses activeMonthlyPeriod dates for lookup
  const monthlyPeriodRecord = goalPeriods.find(
    (p) => p.type === "monthly" &&
      p.periodStart === activeMonthlyPeriod.periodStart &&
      p.periodEnd === activeMonthlyPeriod.periodEnd
  );
  const monthlyPeriodTitle = (monthlyPeriodRecord?.title ?? "") as string;
  const monthlyPeriodDescription = (monthlyPeriodRecord?.description ?? "") as string;

  const addGoal = async (title: string, type: GoalType) => {
    if (!user) return;
    const period = type === "monthly" ? activeMonthlyPeriod : getCurrentPeriod(type);
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

  const linkGoal = async (id: string, linkedGoalId: string | null) => {
    const updated = await updateGoal(id, { linkedGoalId });
    if (updated) {
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    }
  };

  // All weekly goals within the active monthly period
  const monthPeriod = activeMonthlyPeriod;
  const quarterWeeklyGoals = goals.filter(
    (g) =>
      g.type === "weekly" &&
      g.periodStart >= monthPeriod.periodStart &&
      g.periodStart <= monthPeriod.periodEnd
  );

  // Quarter effort: completed tasks linked to each quarterly goal / total weekly goals in quarter
  const completedQuarter = quarterWeeklyGoals.filter((g) => g.completed);
  const quarterTotal = quarterWeeklyGoals.length; // denominator = all tasks, not just completed
  const quarterEffort: QuarterEffortEntry[] = (() => {
    if (quarterTotal === 0) {
      return monthlyGoals.map((mg) => ({ goalId: mg.id, percentage: 0, count: 0 }));
    }
    const result: QuarterEffortEntry[] = monthlyGoals.map((mg) => {
      const count = completedQuarter.filter((g) => g.linkedGoalId === mg.id).length;
      return { goalId: mg.id, percentage: count / quarterTotal, count };
    });
    const linkedCount = completedQuarter.filter((g) => g.linkedGoalId != null).length;
    result.push({ goalId: null, percentage: (completedQuarter.length - linkedCount) / quarterTotal, count: completedQuarter.length - linkedCount });
    return result;
  })();

  const updateMonthlyPeriodStart = async (startDate: string) => {
    if (!user) return;
    const endDate = format(subDays(addMonths(parseISO(startDate), 4), 1), "yyyy-MM-dd");
    const updated = await upsertGoalPeriod({
      type: "monthly",
      periodStart: startDate,
      periodEnd: endDate,
      title: monthlyPeriodTitle,
      description: monthlyPeriodDescription,
    }, user.id);
    if (updated) {
      setGoalPeriods((prev) => {
        const filtered = prev.filter(
          (p) => !(p.type === "monthly" && p.periodStart === activeMonthlyPeriod.periodStart)
        );
        return [...filtered, updated];
      });
    }
  };

  const updatePeriod = async (type: GoalType, updates: { title: string; description: string }) => {
    if (!user) return;
    const period = type === "monthly" ? activeMonthlyPeriod : getCurrentPeriod(type);
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
        linkGoal,
        weeklyPeriodTitle,
        monthlyPeriodTitle,
        semesterPeriodTitle,
        weeklyPeriodDescription,
        monthlyPeriodDescription,
        semesterPeriodDescription,
        updatePeriod,
        updateMonthlyPeriodStart,
        monthlyPeriodStart: activeMonthlyPeriod.periodStart,
        monthlyPeriodEnd: activeMonthlyPeriod.periodEnd,
        quarterEffort,
        quarterWeeklyGoals,
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
};
