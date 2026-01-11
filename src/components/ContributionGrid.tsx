import { useMemo } from "react";
import { useHabits } from "@/context/HabitsContext";
import {
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  format,
  getDay,
  startOfWeek,
  isFuture,
  isToday,
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
  const { getContributionLevel, getDateKey } = useHabits();

  const { weeks, monthLabels } = useMemo(() => {
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

    // Calculate month labels positions
    const monthLabels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0];
      const month = firstDayOfWeek.getMonth();
      if (month !== lastMonth && firstDayOfWeek.getFullYear() === year) {
        monthLabels.push({ month: MONTHS[month], weekIndex });
        lastMonth = month;
      }
    });

    return { weeks, monthLabels };
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
        <div className="flex mb-2 ml-8">
          {monthLabels.map(({ month, weekIndex }, i) => (
            <div
              key={`${month}-${i}`}
              className="text-xs text-muted-foreground"
              style={{
                position: "relative",
                left: `${weekIndex * 14}px`,
                width: "40px",
              }}
            >
              {month}
            </div>
          ))}
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
                {week.map((day) => {
                  const dayOfWeek = getDay(day);
                  const isInYear = day.getFullYear() === year;
                  const future = isFuture(day) && !isToday(day);
                  const level =
                    isInYear && !future ? getContributionLevel(day) : 0;
                  const isSelected =
                    selectedDate &&
                    getDateKey(selectedDate) === getDateKey(day);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => !future && isInYear && onSelectDate(day)}
                      disabled={true}
                      className={`
                        w-[11px] h-[11px] rounded-sm transition-all
                        ${isInYear && !future ? getContributionClass(level) : "bg-transparent"}
                        cursor-default
                        border-none outline-none ring-0
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
