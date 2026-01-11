import { useMemo } from "react";
import { useHabits } from "@/context/useHabits";
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
  const { getHabitsWithLogsForDate } = useHabits();

  const getContributionLevelForDate = async (date: Date): Promise<number> => {
    try {
      const habitsWithLogs = await getHabitsWithLogsForDate(date);
      if (!habitsWithLogs) return 0;

      const completedCount = habitsWithLogs.filter(
        (habit) => habit.logs && habit.logs.length > 0,
      ).length;

      return Math.min(completedCount, 4);
    } catch (error) {
      console.error("Error calculating contribution level:", error);
      return 0;
    }
  };

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

                  // For days not in the year and not future, render invisible placeholder to maintain alignment
                  if (!isInYear && !future) {
                    return (
                      <div
                        key={day.toISOString()}
                        className="w-[11px] h-[11px] invisible"
                      />
                    );
                  }

                  const level = 0;
                  const isSelected = false;

                  const isFutureEmpty = future && isInYear;

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => !future && isInYear && onSelectDate(day)}
                      disabled={true}
                      className={`
                        w-[11px] h-[11px] rounded-[3px] transition-all
                        ${isInYear && !future ? getContributionClass(level) : "bg-transparent"}
                        ${isFutureEmpty ? "border border-border/50" : "border-none"}
                        outline-none ring-0
                        cursor-default
                      `}
                      title={isInYear ? format(day, "MMM d, yyyy") : ""}
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
