import { useMemo, useState, useEffect, Fragment } from "react";
import { useHabits } from "@/context/useHabits";
import { Skeleton } from "@/components/ui/skeleton";
import {
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  format,
  getDay,
  startOfWeek,
  isFuture,
  isToday,
  startOfMonth,
} from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContributionGridProps {
  year: number;
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const ContributionGrid = ({
  year,
  onSelectDate,
  selectedDate,
}: ContributionGridProps) => {
  const { visibleHabits, allHabitLogs, isLoading } = useHabits();
  const [isCmdPressed, setIsCmdPressed] = useState(false);

  const { contributionLevels, dayRatios, completedHabitIds } = useMemo(() => {
    const levels = new Map<string, number>();
    const ratios = new Map<string, { completed: number; total: number }>();
    const completedIds = new Map<string, Set<string>>();

    if (allHabitLogs) {
      // Group logs by date
      const logsByDate = new Map<string, Set<string>>();
      for (const log of allHabitLogs) {
        const logDateStr = log.integerDate.toString();
        if (!logsByDate.has(logDateStr)) {
          logsByDate.set(logDateStr, new Set());
        }
        logsByDate.get(logDateStr)!.add(log.habitId);
      }

      const totalHabits = visibleHabits.length || 0;

      // Calculate level and ratio for each date
      logsByDate.forEach((habitIds, dateStr) => {
        levels.set(dateStr, Math.min(habitIds.size, 4));
        ratios.set(dateStr, {
          completed: habitIds.size,
          total: totalHabits,
        });
        completedIds.set(dateStr, new Set(habitIds));
      });
    }

    return {
      contributionLevels: levels,
      dayRatios: ratios,
      completedHabitIds: completedIds,
    };
  }, [allHabitLogs, visibleHabits.length]);

  // Track CMD key state - optimized to prevent unnecessary updates
  useEffect(() => {
    let cmdPressed = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.key === "Meta") && !cmdPressed) {
        cmdPressed = true;
        setIsCmdPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Meta" && cmdPressed) {
        cmdPressed = false;
        setIsCmdPressed(false);
      }
    };

    // Handle blur event to reset CMD state when window loses focus
    const handleBlur = () => {
      if (cmdPressed) {
        cmdPressed = false;
        setIsCmdPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: true });
    window.addEventListener("keyup", handleKeyUp, { passive: true });
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  const { weeks, monthLabels, allDays } = useMemo(() => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));

    // Start from the beginning of the week containing Jan 1
    const gridStart = startOfWeek(yearStart, { weekStartsOn: 0 });

    const allDays = eachDayOfInterval({ start: gridStart, end: yearEnd });

    // Group days into weeks
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    allDays.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    // Calculate month labels positions - align with columns (weeks)

    const monthLabels: { month: string; columnIndex: number }[] = [];
    let lastColumnIndex = -1;

    for (let month = 0; month < 12; month++) {
      const firstDayOfMonth = startOfMonth(new Date(year, month, 1));

      const dayIndex = allDays.findIndex(
        (day) => day.getTime() === firstDayOfMonth.getTime()
      );

      if (dayIndex !== -1) {
        const columnIndex = Math.floor(dayIndex / 7);

        if (columnIndex !== lastColumnIndex) {
          monthLabels.push({
            month: MONTHS[month],
            columnIndex,
          });
          lastColumnIndex = columnIndex;
        }
      }
    }

    return { weeks, monthLabels, allDays };
  }, [year]);

  const getContributionClass = (level: number): string => {
    switch (level) {
      case 0:
        return "bg-contribution-0";
      case 1:
        return "bg-contribution-1";
      case 2:
        return "bg-contribution-2";
      case 3:
        return "bg-contribution-3";
      case 4:
        return "bg-contribution-4";
      case 5:
        return "bg-contribution-5";
      default:
        return "bg-contribution-0";
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-max">
        {/* Month labels */}
        <div className="flex mb-2 ml-8 relative h-4">
          {monthLabels.map(({ month, columnIndex }, i) => {
            // Each column is 11px (cell) + 2.5px (gap) = 13.5px wide
            // Add a small offset to the right (like GitHub) for better visual alignment
            const leftPosition = columnIndex * 13.5 + 4;

            return (
              <div
                key={`${month}-${i}`}
                className="text-xs text-muted-foreground absolute top-0"
                style={{
                  left: `${leftPosition}px`,
                  minWidth: "40px",
                }}
              >
                {month}
              </div>
            );
          })}
        </div>

        <div className="flex gap-1">
          {/* Weekday labels */}
          <div className="flex flex-col gap-[3px] mr-2 text-xs text-muted-foreground">
            {WEEKDAYS.map((day, i) => (
              <div key={day} className="h-[11px] flex items-center">
                {i % 2 === 1 ? day : ""}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[2.5px]">
            {isLoading ? (
              <Skeleton
                className="h-[92px] rounded-[3px]"
                style={{ width: `${weeks.length * 13.5 - 2.5}px` }}
              />
            ) : (
              weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2.5px]">
                  {week.map((day, dayIndexInWeek) => {
                    const dayOfWeek = getDay(day);
                    const isInYear = day.getFullYear() === year;
                    const future = isFuture(day) && !isToday(day);
                    const past = !isToday(day) && !isFuture(day);
                    const today = isToday(day);

                    // For days not in the year and not future, render invisible placeholder to maintain alignment
                    if (!isInYear && !future) {
                      return (
                        <div
                          key={day.toISOString()}
                          className="w-[11px] h-[11px] invisible"
                        />
                      );
                    }

                    const dateStr = format(day, "yyyyMMdd");
                    const level = contributionLevels.get(dateStr) || 0;
                    const ratio = dayRatios.get(dateStr) || {
                      completed: 0,
                      total: visibleHabits.length || 0,
                    };
                    const completedIds =
                      completedHabitIds.get(dateStr) || new Set<string>();
                    const isSelected =
                      selectedDate &&
                      format(selectedDate, "yyyyMMdd") === dateStr;

                    const isFutureEmpty = future && isInYear;

                    // Only today is clickable - past and future days are not
                    const isClickable = today && isInYear;

                    // Show tooltip for all days in the year
                    const showTooltip = isInYear;
                    const formattedDate = format(day, "MMM d");

                    const button = (
                      <button
                        onClick={() => {
                          if (isClickable) {
                            onSelectDate(day);
                          }
                        }}
                        disabled={!isClickable}
                        className={`
                        w-[11px] h-[11px] rounded-[3px] transition-all
                        ${isInYear && !future ? getContributionClass(level) : "bg-transparent"}
                        ${isFutureEmpty ? "border border-border/50" : "border-0"}
                        ${today ? "!border-0 !ring-0" : ""}
                        ${isSelected ? "ring-2 ring-foreground/50" : ""}
                        outline-none
                        ${isInYear ? "cursor-pointer hover:ring-1 hover:ring-foreground/30" : "cursor-not-allowed"}
                      `}
                        aria-label={isInYear ? format(day, "MMM d, yyyy") : ""}
                      />
                    );

                    if (showTooltip) {
                      return (
                        <Tooltip key={day.toISOString()}>
                          <TooltipTrigger asChild>{button}</TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className={`!bg-[rgba(245,240,230,0.9)] !border-[rgba(200,190,175,0.4)] text-foreground backdrop-blur-sm shadow-lg transition-opacity duration-150 ${
                              isCmdPressed ? "" : "opacity-60"
                            }`}
                          >
                            {isCmdPressed ? (
                              <div className="text-left space-y-1.5 min-w-[180px] max-w-[250px]">
                                <div className="font-medium text-center border-b border-border/30 pb-1 mb-1">
                                  {formattedDate}
                                </div>
                                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                  {visibleHabits.length > 0 ? (
                                    visibleHabits.map((habit) => {
                                      const isCompleted = completedIds.has(
                                        habit.id
                                      );
                                      return (
                                        <div
                                          key={habit.id}
                                          className={`text-sm transition-opacity duration-100 ${
                                            isCompleted
                                              ? "text-foreground font-normal"
                                              : "text-muted-foreground opacity-30"
                                          }`}
                                        >
                                          {habit.name}
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="text-xs text-muted-foreground">
                                      No habits
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center space-y-0.5">
                                <div className="font-medium">
                                  {formattedDate}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {ratio.completed}/{ratio.total}
                                </div>
                              </div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return (
                      <Fragment key={day.toISOString()}>{button}</Fragment>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
