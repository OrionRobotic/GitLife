import { format, isToday, isFuture } from "date-fns";
import { useHabits } from "@/context/HabitsContext";
import { Dumbbell, Utensils, BookOpen, Moon } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface DayEditorProps {
  date: Date;
  onClose: () => void;
}

const HABIT_ICONS: Record<string, LucideIcon> = {
  Workout: Dumbbell,
  "Healthy Eating": Utensils,
  Reading: BookOpen,
  "Good Sleep": Moon,
};

export const DayEditor = ({ date, onClose }: DayEditorProps) => {
  const { visibleHabits, updateHabitStatus } = useHabits();

  const future = isFuture(date) && !isToday(date);

  const habitsForDisplay = visibleHabits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    icon: HABIT_ICONS[habit.name] || BookOpen,
  }));

  const handleChange = async (
    habitId: string,
    habitName: string,
    completed: boolean,
  ) => {
    await updateHabitStatus(habitName, completed);
  };

  return (
    <div className="p-6 bg-card border border-border rounded-lg max-w-sm w-full">
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
            habitsForDisplay.map(({ id, name, icon: Icon }) => (
              <div key={id}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {name}
                  </span>
                  <div className="ml-auto flex gap-1">
                    <button
                      onClick={() => handleChange(id, name, false)}
                      className={`
                        h-8 px-3 rounded text-sm font-medium transition-all
                        bg-foreground text-background
                      `}
                    >
                      No
                    </button>
                    <button
                      onClick={() => handleChange(id, name, true)}
                      className={`
                        h-8 px-3 rounded text-sm font-medium transition-all
                        bg-muted hover:bg-muted-foreground/20 text-foreground
                      `}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="text-lg font-medium text-foreground">
                {habitsForDisplay.length}/{habitsForDisplay.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
