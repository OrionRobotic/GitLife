import { useState, useEffect } from 'react';
import { format, isToday, isFuture } from 'date-fns';
import { useHabits, DayEntry } from '@/hooks/useHabits';
import { Dumbbell, Utensils, BookOpen } from 'lucide-react';

interface DayEditorProps {
  date: Date;
  onClose: () => void;
}

const HABITS = [
  { key: 'workout' as const, label: 'Workout', icon: Dumbbell },
  { key: 'eating' as const, label: 'Eating', icon: Utensils },
  { key: 'reading' as const, label: 'Reading', icon: BookOpen },
];

export const DayEditor = ({ date, onClose }: DayEditorProps) => {
  const { getEntry, setEntry, getTotalScore } = useHabits();
  const existingEntry = getEntry(date);
  
  const [values, setValues] = useState<DayEntry>({
    workout: existingEntry?.workout || 0,
    eating: existingEntry?.eating || 0,
    reading: existingEntry?.reading || 0,
  });

  const future = isFuture(date) && !isToday(date);

  useEffect(() => {
    const entry = getEntry(date);
    setValues({
      workout: entry?.workout || 0,
      eating: entry?.eating || 0,
      reading: entry?.reading || 0,
    });
  }, [date]);

  const handleChange = (key: keyof DayEntry, value: number) => {
    const newValues = { ...values, [key]: value };
    setValues(newValues);
    setEntry(date, newValues);
  };

  const totalScore = values.workout + values.eating + values.reading;

  return (
    <div className="p-6 bg-card border border-border rounded-lg max-w-sm w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-foreground">
            {format(date, 'EEEE')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(date, 'MMMM d, yyyy')}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors text-xl"
        >
          ×
        </button>
      </div>

      {future ? (
        <p className="text-muted-foreground text-sm">
          Cannot log future dates.
        </p>
      ) : (
        <div className="space-y-5">
          {HABITS.map(({ key, label, icon: Icon }) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{label}</span>
                <span className="ml-auto text-sm text-muted-foreground">{values[key]}/5</span>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleChange(key, val)}
                    className={`
                      flex-1 h-8 rounded text-sm font-medium transition-all
                      ${values[key] === val 
                        ? 'bg-foreground text-background' 
                        : 'bg-muted hover:bg-muted-foreground/20 text-foreground'
                      }
                    `}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total score</span>
              <span className="text-lg font-medium text-foreground">{totalScore}/15</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
