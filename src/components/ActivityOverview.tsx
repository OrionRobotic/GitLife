import { useMemo, useState } from "react";
import { useHabits } from "@/context/useHabits";
import {
  subDays,
  subMonths,
  subYears,
  eachDayOfInterval,
  format,
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

interface ActivityOverviewProps {
  filteredHabitIds: string[] | null;
  color: string;
}

export const ActivityOverview = ({
  filteredHabitIds,
  color,
}: ActivityOverviewProps) => {
  const [period, setPeriod] = useState<PeriodKey>("week");
  const [showTotal, setShowTotal] = useState(false);
  const { visibleHabits, allHabitLogs } = useHabits();

  const chartConfig = {
    percentage: { label: "Completion", color },
  } satisfies ChartConfig;

  const data = useMemo(() => {
    const activeFilter = showTotal ? null : filteredHabitIds;
    const filterSet = activeFilter ? new Set(activeFilter) : null;

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

    const rangeDateStrs = new Set(allDays.map((d) => format(d, "yyyyMMdd")));

    const habitDayCounts = new Map<string, Set<string>>();
    for (const habit of habits) {
      habitDayCounts.set(habit.id, new Set());
    }

    for (const log of allHabitLogs) {
      if (!log.integerDate) continue;
      const dateStr = log.integerDate.toString();
      if (!rangeDateStrs.has(dateStr)) continue;
      const daySet = habitDayCounts.get(log.habitId);
      if (daySet) daySet.add(dateStr);
    }

    return habits.map((habit) => ({
      habit: habit.name,
      percentage: Math.round(
        ((habitDayCounts.get(habit.id)?.size ?? 0) / totalDays) * 100
      ),
    }));
  }, [visibleHabits, allHabitLogs, filteredHabitIds, showTotal, period]);

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

  const visiblePolarAngles = dummyCount > 0
    ? Array.from({ length: data.length }, (_, i) => 90 - (i / radarData.length) * 360)
    : undefined;

  if (!data.length) return null;

  const creamyBase = "bg-background border border-border/50 text-foreground";

  return (
    <div>
      <h3 className="text-xl font-normal text-foreground font-serif tracking-tight mb-3">
        Activity Overview
      </h3>

      {/* Controls row: period dropdown + Total toggle */}
      <div className="flex items-center gap-2 mb-3">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodKey)}
          className={`text-xs rounded px-2 py-0.5 outline-none cursor-pointer transition-colors ${creamyBase}`}
        >
          {PERIODS.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
        {filteredHabitIds && (
          <button
            onClick={() => setShowTotal((v) => !v)}
            className={`px-2 py-0.5 text-xs rounded border transition-colors ${
              showTotal
                ? "bg-foreground/10 border-border/60 text-foreground"
                : creamyBase
            }`}
          >
            Total
          </button>
        )}
      </div>

      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-[250px] w-full [&_.recharts-polar-grid-concentric-polygon]:hidden [&_.recharts-polar-grid-concentric-circle]:hidden"
      >
        <RadarChart data={radarData} outerRadius="62%">
          <PolarGrid {...(visiblePolarAngles ? { polarAngles: visiblePolarAngles } : {})} />
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
            fill={color}
            fillOpacity={0.3}
            stroke={color}
            strokeWidth={data.length === 1 ? 2 : 1}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload?.habit === "\u200B" || payload?.habit === "\u200C") return <g />;
              return (
                <circle cx={cx} cy={cy} r={2} fill={color} fillOpacity={1} stroke="none" />
              );
            }}
            activeDot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload?.habit === "\u200B" || payload?.habit === "\u200C") return <g />;
              return (
                <circle cx={cx} cy={cy} r={3} fill={color} fillOpacity={1} stroke="none" />
              );
            }}
          />
        </RadarChart>
      </ChartContainer>
    </div>
  );
};
