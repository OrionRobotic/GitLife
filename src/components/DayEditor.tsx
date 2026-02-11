import { format, isToday, isFuture } from "date-fns";
import { useState, useEffect } from "react";
import { useHabits } from "@/context/useHabits";
import { Dumbbell, Utensils, BookOpen, Moon } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface DayEditorProps {
  date: Date;
  onClose: () => void;
  filteredHabitIds?: string[] | null;
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

export const DayEditor = ({ date, onClose, filteredHabitIds }: DayEditorProps) => {
  const {
    visibleHabits: allVisibleHabits,
    updateHabitStatus,
    allHabitLogs,
    todaysCompletedHabitIds,
  } = useHabits();

  const visibleHabits = filteredHabitIds
    ? allVisibleHabits.filter((h) => new Set(filteredHabitIds).has(h.id))
    : allVisibleHabits;

  const getInitialCompletedIds = () => {
    if (isToday(date)) {
      return todaysCompletedHabitIds || new Set();
    }
    const logs = allHabitLogs || [];
    const selectedDateStr = format(date, "yyyyMMdd");
    const completedIds = new Set<string>();
    for (const log of logs) {
      if (log.integerDate && log.integerDate.toString() === selectedDateStr) {
        completedIds.add(log.habitId);
      }
    }
    return completedIds;
  };

  const [completedHabitIds, setCompletedHabitIds] = useState(
    getInitialCompletedIds
  );

  const future = isFuture(date) && !isToday(date);

  useEffect(() => {
    setCompletedHabitIds(getInitialCompletedIds());
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
                  <button
                    onClick={() => handleChange(id, name, !completed)}
                    className={`
                      ml-8 w-3.5 h-3.5 rounded-[2px] transition-all border
                      ${
                        completed
                          ? "bg-contribution-3 border-contribution-3"
                          : "bg-background border-border hover:border-foreground/30"
                      }
                    `}
                    aria-label={completed ? "Mark incomplete" : "Mark complete"}
                  >
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
