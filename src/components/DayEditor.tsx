import { format, isToday, isFuture } from "date-fns";
import { useHabits } from "@/context/HabitsContext";
import { DayEntry } from "@/types/habits";
import { Dumbbell, Utensils, BookOpen, Moon } from "lucide-react";

interface DayEditorProps {
  date: Date;
  onClose: () => void;
}

const HABITS = [
  { key: "workout" as const, label: "Workout", icon: Dumbbell },
  { key: "eating" as const, label: "Eating", icon: Utensils },
  { key: "reading" as const, label: "Reading", icon: BookOpen },
  { key: "sleep" as const, label: "Sleep", icon: Moon },
];

export const DayEditor = ({ date, onClose }: DayEditorProps) => {
  const { getEntry, setEntry } = useHabits();
  const entry = getEntry(date);

  const values = {
    workout: entry?.workout || false,
    eating: entry?.eating || false,
    reading: entry?.reading || false,
    sleep: entry?.sleep || false,
  };

  const future = isFuture(date) && !isToday(date);

  const handleChange = (key: keyof DayEntry, value: boolean) => {
    const newValues = { ...values, [key]: value };
    setEntry(date, newValues);
  };

  return (
    <div className="p-6 bg-card border border-border rounded-lg max-w-2xl w-full">
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
          {HABITS.map(({ key, label, icon: Icon }) => (
            <div key={key}>
              <div className="flex items-center justify-between gap-12">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {label}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleChange(key, false)}
                    className={`
                      h-8 px-3 rounded text-sm font-medium transition-all
                      ${
                        values[key] === false
                          ? "bg-foreground text-background"
                          : "bg-muted hover:bg-muted-foreground/20 text-foreground"
                      }
                    `}
                  >
                    No
                  </button>
                  <button
                    onClick={() => handleChange(key, true)}
                    className={`
                      h-8 px-3 rounded text-sm font-medium transition-all
                      ${
                        values[key] === true
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
          ))}
        </div>
      )}
    </div>
  );
};
