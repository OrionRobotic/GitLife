import { format, isToday, isFuture } from "date-fns";
import { useState, useEffect } from "react";
import { useHabits } from "@/context/useHabits";
import { Dumbbell, Utensils, BookOpen, Moon } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface DayEditorProps {
  date: Date;
  onClose: () => void;
}

const HABIT_ICONS: Record<string, LucideIcon> = {
  workout: Dumbbell,
  eating: Utensils,
  reading: BookOpen,
  sleep: Moon,
};

const getHabitIcon = (name: string): LucideIcon => {
  const normalizedName = name.toLowerCase();
  return HABIT_ICONS[normalizedName] || BookOpen;
};

export const DayEditor = ({ date, onClose }: DayEditorProps) => {
  const {
    visibleHabits,
    updateHabitStatus,
    allHabitLogs,
    todaysCompletedHabitIds,
  } = useHabits();
  const [completedHabitIds, setCompletedHabitIds] = useState<Set<string>>(
    new Set()
  );

  const future = isFuture(date) && !isToday(date);

  useEffect(() => {
    if (isToday(date)) {
      setCompletedHabitIds(todaysCompletedHabitIds || new Set());
    } else {
      const logs = allHabitLogs || [];
      const selectedDateStr = format(date, "yyyyMMdd");
      const completedIds = new Set<string>();
      for (const log of logs) {
        if (log.integerDate.toString() === selectedDateStr) {
          completedIds.add(log.habitId);
        }
      }
      setCompletedHabitIds(completedIds);
    }
  }, [date, allHabitLogs, todaysCompletedHabitIds]);

  const habitsForDisplay = visibleHabits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    icon: getHabitIcon(habit.name),
    completed: completedHabitIds.has(habit.id),
  }));

  const handleChange = async (
    habitId: string,
    habitName: string,
    completed: boolean
  ) => {
    // Optimistic update - update UI immediately
    setCompletedHabitIds((prev) => {
      const newSet = new Set(prev);
      if (completed) {
        newSet.add(habitId);
      } else {
        newSet.delete(habitId);
      }
      return newSet;
    });

    try {
      await updateHabitStatus(habitName, completed, date);
    } catch (error) {
      console.error("Failed to update habit status:", error);
      // Revert optimistic update on error
      setCompletedHabitIds((prev) => {
        const newSet = new Set(prev);
        if (completed) {
          newSet.delete(habitId);
        } else {
          newSet.add(habitId);
        }
        return newSet;
      });
    }
  };

  return (
    <div className="p-6 bg-card border border-border rounded-lg max-w-3xl w-full">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-foreground">
          {format(date, "EEEE")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {format(date, "MMMM d, yyyy")}
        </p>
      </div>

      {future ? (
        <p className="text-muted-foreground text-sm">
          Cannot log future dates.
        </p>
      ) : (
        <div className="space-y-3">
          {habitsForDisplay.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No habits found. Create some habits first!
            </p>
          ) : (
            habitsForDisplay.map(({ id, name, icon: Icon, completed }) => (
              <div key={id}>
                <div className="flex items-center gap-4">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground flex-1">
                    {name}
                  </span>
                  <div className="ml-8 flex gap-1">
                    <button
                      onClick={() => handleChange(id, name, false)}
                      className={`
                        h-8 px-3 rounded text-sm font-medium transition-all
                        ${
                          !completed
                            ? "bg-foreground text-background"
                            : "bg-muted hover:bg-muted-foreground/20 text-foreground"
                        }
                      `}
                    >
                      No
                    </button>
                    <button
                      onClick={() => handleChange(id, name, true)}
                      className={`
                        h-8 px-3 rounded text-sm font-medium transition-all
                        ${
                          completed
                            ? "bg-foreground text-background"
                            : "bg-muted hover:bg-muted-foreground/20 text-foreground"
                        }
                      `}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
