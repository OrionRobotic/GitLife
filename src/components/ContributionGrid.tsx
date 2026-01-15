import { useMemo, useState, useEffect } from "react";
import { useHabits } from "@/context/useHabits";
import { getHabitsForUser } from "@/services/habits";
import { useAuth } from "@/context/AuthContext";
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
  const { refreshTrigger } = useHabits();
  const { user } = useAuth();
  const [contributionLevels, setContributionLevels] = useState<
    Map<string, number>
  >(new Map());

  // Calculate contribution levels for all days in the year
  useEffect(() => {
    const calculateLevels = async () => {
      if (!user) {
        setContributionLevels(new Map());
        return;
      }

      const habitLogs = await getHabitsForUser(user.id);
      if (!habitLogs) {
        setContributionLevels(new Map());
        return;
      }

      const levels = new Map<string, number>();

      // Group logs by date
      const logsByDate = new Map<string, Set<string>>();
      for (const log of habitLogs) {
        const logDateStr = format(new Date(log.createdAt), "yyyy-MM-dd");
        if (!logsByDate.has(logDateStr)) {
          logsByDate.set(logDateStr, new Set());
        }
        logsByDate.get(logDateStr)!.add(log.habitId);
      }

      // Calculate level for each date (number of unique habits completed)
      logsByDate.forEach((habitIds, dateStr) => {
        levels.set(dateStr, Math.min(habitIds.size, 4));
      });

      setContributionLevels(levels);
    };

    calculateLevels();
  }, [user, refreshTrigger]);

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
        (day) => day.getTime() === firstDayOfMonth.getTime(),
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
            // Each column is 11px (cell) + 3px (gap) = 14px wide
            // Add a small offset to the right (like GitHub) for better visual alignment
            const leftPosition = columnIndex * 14 + 4;

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
          <div className="flex gap-[3px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
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

                  const dateStr = format(day, "yyyy-MM-dd");
                  const level = contributionLevels.get(dateStr) || 0;
                  const isSelected =
                    selectedDate &&
                    format(selectedDate, "yyyy-MM-dd") === dateStr;

                  const isFutureEmpty = future && isInYear;

                  // Only today is clickable - past and future days are not
                  const isClickable = today && isInYear;

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => {
                        if (isClickable) {
                          onSelectDate(day);
                        }
                      }}
                      disabled={!isClickable}
                      className={`
                        w-[11px] h-[11px] rounded-[3px] transition-all
                        ${isInYear && !future ? getContributionClass(level) : "bg-transparent"}
                        ${isFutureEmpty ? "border border-border/50" : "border-none"}
                        ${isSelected ? "ring-2 ring-foreground/50" : ""}
                        ${past ? "opacity-60" : ""}
                        outline-none
                        ${isClickable ? "cursor-pointer hover:ring-1 hover:ring-foreground/30" : "cursor-not-allowed"}
                      `}
                      title={isInYear ? format(day, "MMM d, yyyy") : ""}
                      aria-label={isInYear ? format(day, "MMM d, yyyy") : ""}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
