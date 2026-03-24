import { format, isToday, isFuture } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { useHabits } from "@/context/useHabits";
import { useDashboards } from "@/hooks/useDashboards";
import {
  // Fitness
  Dumbbell,
  Bike,
  Flame,
  Zap,
  Activity,
  Timer,
  Trophy,
  Mountain,
  Footprints,
  PersonStanding,
  Waves,
  // Food & Drink
  Utensils,
  Coffee,
  Droplets,
  Apple,
  Wine,
  Soup,
  Sandwich,
  // Mind & Learning
  BookOpen,
  Brain,
  Lightbulb,
  GraduationCap,
  Code,
  Pencil,
  FileText,
  Newspaper,
  // Wellness
  Heart,
  Moon,
  Sun,
  Smile,
  Leaf,
  Sparkles,
  Wind,
  Pill,
  Stethoscope,
  // Creativity
  Music,
  Palette,
  Camera,
  Mic,
  Headphones,
  PenTool,
  // Productivity
  Target,
  Clock,
  CheckSquare,
  List,
  Briefcase,
  Laptop,
  // Social & Life
  Users,
  MessageCircle,
  Home,
  Star,
  Globe,
  Map,
  Dog,
  Baby,
  Plus,
  Check,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DayEditorProps {
  date: Date;
  onClose: () => void;
}

export const ICON_MAP: Record<string, LucideIcon> = {
  // Fitness
  Dumbbell,
  Bike,
  Flame,
  Zap,
  Activity,
  Timer,
  Trophy,
  Mountain,
  Footprints,
  PersonStanding,
  Waves,
  // Food & Drink
  Utensils,
  Coffee,
  Droplets,
  Apple,
  Wine,
  Soup,
  Sandwich,
  // Mind & Learning
  BookOpen,
  Brain,
  Lightbulb,
  GraduationCap,
  Code,
  Pencil,
  FileText,
  Newspaper,
  // Wellness
  Heart,
  Moon,
  Sun,
  Smile,
  Leaf,
  Sparkles,
  Wind,
  Pill,
  Stethoscope,
  // Creativity
  Music,
  Palette,
  Camera,
  Mic,
  Headphones,
  PenTool,
  // Productivity
  Target,
  Clock,
  CheckSquare,
  List,
  Briefcase,
  Laptop,
  // Social & Life
  Users,
  MessageCircle,
  Home,
  Star,
  Globe,
  Map,
  Dog,
  Baby,
};

export const ICON_OPTIONS = Object.keys(ICON_MAP);

const getHabitIcon = (iconName?: string): LucideIcon => {
  if (iconName && ICON_MAP[iconName]) return ICON_MAP[iconName];
  // Legacy fallback: infer from name
  return BookOpen;
};

export const DayEditor = ({ date, onClose }: DayEditorProps) => {
  const {
    visibleHabits: allVisibleHabits,
    updateHabitStatus,
    allHabitLogs,
    todaysCompletedHabitIds,
    createNewHabit,
    removeHabit,
    changeHabitIcon,
  } = useHabits();

  const { dashboards } = useDashboards();

  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("BookOpen");
  const [isCreating, setIsCreating] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [iconPickerHabitId, setIconPickerHabitId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const visibleHabits = (() => {
    if (activeTabId === null) return allVisibleHabits;
    const dashboard = dashboards.find((d) => d.id === activeTabId);
    return dashboard
      ? allVisibleHabits.filter((h) => dashboard.habitIds.includes(h.id))
      : allVisibleHabits;
  })();

  const getInitialCompletedIds = () => {
    if (isToday(date)) return todaysCompletedHabitIds || new Set();
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

  const [completedHabitIds, setCompletedHabitIds] = useState(getInitialCompletedIds);
  const future = isFuture(date) && !isToday(date);

  useEffect(() => {
    setCompletedHabitIds(getInitialCompletedIds());
  }, [date, allHabitLogs, todaysCompletedHabitIds]);

  useEffect(() => {
    if (showAddHabit && inputRef.current) inputRef.current.focus();
  }, [showAddHabit]);

  const habitsForDisplay = visibleHabits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    icon: getHabitIcon(habit.icon),
    completed: completedHabitIds.has(habit.id),
  }));

  const handleChange = async (habitId: string, habitName: string, completed: boolean) => {
    setCompletedHabitIds((prev) => {
      const next = new Set(prev);
      completed ? next.add(habitId) : next.delete(habitId);
      return next;
    });
    try {
      await updateHabitStatus(habitName, completed, date);
    } catch {
      setCompletedHabitIds((prev) => {
        const next = new Set(prev);
        completed ? next.delete(habitId) : next.add(habitId);
        return next;
      });
    }
  };

  const handleDelete = async (habitId: string) => {
    await removeHabit(habitId);
  };

  const handleAddHabit = async () => {
    const trimmed = newHabitName.trim();
    if (!trimmed) return;
    setIsCreating(true);
    setAddError(null);
    try {
      const success = await createNewHabit(trimmed, selectedIcon);
      if (success) {
        setNewHabitName("");
        setSelectedIcon("BookOpen");
        setShowAddHabit(false);
      } else {
        setAddError("Failed to add habit");
      }
    } catch {
      setAddError("Failed to add habit");
    } finally {
      setIsCreating(false);
    }
  };

  const hasTabs = dashboards.length > 0;

  return (
    <div className="p-6 bg-card border border-border rounded-lg max-w-3xl w-full">
      <div className="mb-5">
        <h2 className="text-lg font-medium text-foreground">{format(date, "EEEE")}</h2>
        <p className="text-sm text-muted-foreground">{format(date, "MMMM d, yyyy")}</p>
      </div>

      {/* Tab filter row */}
      {hasTabs && (
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          <button
            onClick={() => setActiveTabId(null)}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              activeTabId === null
                ? "bg-foreground/10 text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            }`}
          >
            All
          </button>
          {dashboards.map((dashboard) => (
            <button
              key={dashboard.id}
              onClick={() => setActiveTabId(activeTabId === dashboard.id ? null : dashboard.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors ${
                activeTabId === dashboard.id
                  ? "bg-foreground/10 text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: dashboard.color }}
              />
              {dashboard.name}
            </button>
          ))}
        </div>
      )}

      {future ? (
        <p className="text-muted-foreground text-sm">Cannot log future dates.</p>
      ) : (
        <div className="space-y-3">
          {habitsForDisplay.length === 0 && (
            <p className="text-muted-foreground text-sm">
              {activeTabId ? "No habits in this tab." : "No habits yet. Add one below!"}
            </p>
          )}

          {habitsForDisplay.map(({ id, name, icon: Icon, completed }) => (
            <div key={id} className="flex flex-col gap-1">
            <div className="group flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIconPickerHabitId((prev) => prev === id ? null : id)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Change icon"
              >
                <Icon className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-foreground flex-1">{name}</span>
              <button
                onClick={() => handleDelete(id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                aria-label="Delete habit"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleChange(id, name, !completed)}
                className={`w-3.5 h-3.5 rounded-[2px] transition-all border shrink-0 ${
                  completed
                    ? "bg-contribution-3 border-contribution-3"
                    : "bg-background border-border hover:border-foreground/30"
                }`}
                aria-label={completed ? "Mark incomplete" : "Mark complete"}
              />
            </div>
            {iconPickerHabitId === id && (
              <div className="flex flex-wrap gap-1 pl-8 max-h-24 overflow-y-auto pr-1">
                {ICON_OPTIONS.map((iconName) => {
                  const IconOption = ICON_MAP[iconName];
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => { changeHabitIcon(id, iconName); setIconPickerHabitId(null); }}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                      aria-label={iconName}
                    >
                      <IconOption className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>
            )}
            </div>
          ))}

          {/* Add habit section */}
          {showAddHabit ? (
            <div className="flex flex-col gap-2 pt-1">
              {/* Icon picker */}
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                {ICON_OPTIONS.map((iconName) => {
                  const IconOption = ICON_MAP[iconName];
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className={`p-1.5 rounded transition-colors ${
                        selectedIcon === iconName
                          ? "bg-foreground/10 text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                      }`}
                      aria-label={iconName}
                    >
                      <IconOption className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>

              {/* Name input row */}
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newHabitName}
                  onChange={(e) => {
                    setNewHabitName(e.target.value);
                    setAddError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddHabit();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setShowAddHabit(false);
                      setNewHabitName("");
                      setAddError(null);
                    }
                  }}
                  placeholder="Habit name..."
                  disabled={isCreating}
                  className="flex-1 text-sm bg-transparent border-b border-border outline-none py-0.5 placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
                <button
                  onClick={handleAddHabit}
                  disabled={!newHabitName.trim() || isCreating}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                  aria-label="Confirm"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setShowAddHabit(false);
                    setNewHabitName("");
                    setAddError(null);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
              {addError && <p className="text-xs text-destructive">{addError}</p>}
            </div>
          ) : (
            <button
              onClick={() => setShowAddHabit(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
            >
              <Plus className="w-3 h-3" />
              Add habit
            </button>
          )}
        </div>
      )}
    </div>
  );
};
