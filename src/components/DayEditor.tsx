import { useState, useEffect } from 'react';
import { format, isToday, isFuture } from 'date-fns';
import { useHabits, DayEntry } from '@/hooks/useHabits';
import { Dumbbell, Utensils, BookOpen, Moon } from 'lucide-react';

interface DayEditorProps {
  date: Date;
  onClose: () => void;
}

const HABITS = [
  { key: 'workout' as const, label: 'Workout', icon: Dumbbell },
  { key: 'eating' as const, label: 'Eating', icon: Utensils },
  { key: 'reading' as const, label: 'Reading', icon: BookOpen },
  { key: 'sleep' as const, label: 'Sleep', icon: Moon },
];

export const DayEditor = ({ date, onClose }: DayEditorProps) => {
  const { getEntry, setEntry, getTotalScore } = useHabits();
  const existingEntry = getEntry(date);

  const [values, setValues] = useState<DayEntry>({
    workout: existingEntry?.workout || false,
    eating: existingEntry?.eating || false,
    reading: existingEntry?.reading || false,
    sleep: existingEntry?.sleep || false,
  });

  const future = isFuture(date) && !isToday(date);

  useEffect(() => {
    const entry = getEntry(date);
    setValues({
      workout: entry?.workout || false,
      eating: entry?.eating || false,
      reading: entry?.reading || false,
      sleep: entry?.sleep || false,
    });
  }, [date, getEntry]);

  const handleChange = (key: keyof DayEntry, value: boolean) => {
    const newValues = { ...values, [key]: value };
    setValues(newValues);
    setEntry(date, newValues);
  };

  const totalScore = values.workout + values.eating + values.reading + values.sleep;

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
          {HABITS.map(({ key, label, icon: Icon }) => (
            <div key={key}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{label}</span>
                <div className="ml-auto flex gap-1">
                  <button
                    onClick={() => handleChange(key, false)}
                    className={`
                      h-8 px-3 rounded text-sm font-medium transition-all
                      ${values[key] === false 
                        ? 'bg-foreground text-background' 
                        : 'bg-muted hover:bg-muted-foreground/20 text-foreground'
                      }
                    `}
                  >
                    No
                  </button>
                  <button
                    onClick={() => handleChange(key, true)}
                    className={`
                      h-8 px-3 rounded text-sm font-medium transition-all
                      ${values[key] === true 
                        ? 'bg-foreground text-background' 
                        : 'bg-muted hover:bg-muted-foreground/20 text-foreground'
                      }
                    `}
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="text-lg font-medium text-foreground">{totalScore}/{HABITS.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
