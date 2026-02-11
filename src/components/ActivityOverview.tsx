import { useMemo, useState } from "react";
import { useHabits } from "@/context/useHabits";
import {
  subDays,
  subMonths,
  subYears,
  eachDayOfInterval,
  format,
  isAfter,
  startOfDay,
} from "date-fns";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const PERIODS = [
  { key: "week", label: "Week", offset: (d: Date) => subDays(d, 7) },
  { key: "month", label: "Month", offset: (d: Date) => subMonths(d, 1) },
  { key: "6months", label: "6 Months", offset: (d: Date) => subMonths(d, 6) },
  { key: "year", label: "Year", offset: (d: Date) => subYears(d, 1) },
] as const;

type PeriodKey = (typeof PERIODS)[number]["key"];

const chartConfig = {
  percentage: {
    label: "Completion",
    color: "#FB8C00",
  },
} satisfies ChartConfig;

interface ActivityOverviewProps {
  filteredHabitIds: string[] | null;
}

export const ActivityOverview = ({
  filteredHabitIds,
}: ActivityOverviewProps) => {
  const [period, setPeriod] = useState<PeriodKey>("week");
  const { visibleHabits, allHabitLogs } = useHabits();

  const data = useMemo(() => {
    const filterSet = filteredHabitIds
      ? new Set(filteredHabitIds)
      : null;

    const habits = filterSet
      ? visibleHabits.filter((h) => filterSet.has(h.id))
      : visibleHabits;

    if (!habits.length || !allHabitLogs) return [];

    const today = startOfDay(new Date());
    const periodDef = PERIODS.find((p) => p.key === period)!;
    const rangeStart = startOfDay(periodDef.offset(today));

    const allDays = eachDayOfInterval({ start: rangeStart, end: today });
    const totalDays = allDays.length;

    if (totalDays === 0) return [];

    // Build set of date strings in range for quick lookup
    const rangeDateStrs = new Set(allDays.map((d) => format(d, "yyyyMMdd")));

    // Count distinct logged days per habit in range
    const habitDayCounts = new Map<string, Set<string>>();
    for (const habit of habits) {
      habitDayCounts.set(habit.id, new Set());
    }

    for (const log of allHabitLogs) {
      if (!log.integerDate) continue;
      const dateStr = log.integerDate.toString();
      if (!rangeDateStrs.has(dateStr)) continue;
      const daySet = habitDayCounts.get(log.habitId);
      if (daySet) {
        daySet.add(dateStr);
      }
    }

    return habits.map((habit) => ({
      habit: habit.name,
      percentage: Math.round(
        ((habitDayCounts.get(habit.id)?.size ?? 0) / totalDays) * 100
      ),
    }));
  }, [visibleHabits, allHabitLogs, filteredHabitIds, period]);

  const radarData = useMemo(() => {
    if (data.length === 1) {
      return [...data, { habit: "\u200B", percentage: 0 }, { habit: "\u200C", percentage: 0 }];
    }
    if (data.length === 2) {
      return [...data, { habit: "\u200B", percentage: 0 }];
    }
    return data;
  }, [data]);

  const dummyCount = radarData.length - data.length;

  if (!data.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-normal text-foreground font-serif tracking-tight">
          Activity Overview
        </h3>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                period === p.key
                  ? "bg-foreground/20 text-foreground"
                  : "bg-foreground/10 text-muted-foreground hover:bg-foreground/15"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <ChartContainer
          config={chartConfig}
          className={`mx-auto aspect-square max-h-[250px] w-full [&_.recharts-polar-grid-concentric-polygon]:hidden [&_.recharts-polar-grid-concentric-circle]:hidden ${dummyCount === 1 ? "[&_.recharts-polar-grid-angle_line:last-child]:hidden" : ""} ${dummyCount === 2 ? "[&_.recharts-polar-grid-angle_line:nth-last-child(-n+2)]:hidden" : ""}`}
        >
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis
              dataKey="habit"
              tick={({ x, y, payload, textAnchor }: any) => {
                if (payload.value === "\u200B" || payload.value === "\u200C") return <g />;
                return (
                  <text x={x} y={y} textAnchor={textAnchor} fontSize={13} fill="var(--foreground)" fontFamily="serif">
                    {payload.value}
                  </text>
                );
              }}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [`${value}%`, "Completion"]}
                />
              }
            />
            <Radar
              dataKey="percentage"
              fill="#FB8C00"
              fillOpacity={0.3}
              stroke="#F57C00"
              strokeWidth={data.length === 1 ? 5 : 2}
            />
          </RadarChart>
        </ChartContainer>
    </div>
  );
};
