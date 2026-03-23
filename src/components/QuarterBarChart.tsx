import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Check } from "lucide-react";
import type { Goal } from "@/types/database/Goal";
import type { QuarterEffortEntry } from "@/context/GoalsContext";
import { QuarterCityView } from "@/components/QuarterCityView";

interface Props {
  monthlyGoals: Goal[];
  effort: QuarterEffortEntry[];
  quarterWeeklyGoals: Goal[];
  periodTitle?: string;
  periodDescription?: string;
  periodStart?: string;
  periodEnd?: string;
  onOpenGoals?: () => void;
}

function groupByWeek(goals: Goal[]): { label: string; goals: Goal[] }[] {
  const map = new Map<string, Goal[]>();
  for (const g of goals) {
    if (!map.has(g.periodStart)) map.set(g.periodStart, []);
    map.get(g.periodStart)!.push(g);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([start, gs]) => ({ label: `w/ ${format(parseISO(start), "MMM d")}`, goals: gs }));
}

export function QuarterBarChart({
  monthlyGoals, effort, quarterWeeklyGoals, periodTitle, periodDescription, periodStart, periodEnd, onOpenGoals,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  if (monthlyGoals.length === 0) return null;

  // Completed goals are always shown as 100%
  const effectiveEffort = effort.map((e) => {
    const goal = monthlyGoals.find((g) => g.id === e.goalId);
    return goal?.completed ? { ...e, percentage: 1 } : e;
  });

  const activeGoal   = monthlyGoals.find((g) => g.id === activeId);
  const linkedWeekly = activeId ? quarterWeeklyGoals.filter((g) => g.linkedGoalId === activeId) : [];
  const weeks        = groupByWeek(linkedWeekly);

  return (
    <div className="mt-2 space-y-2">
      {(periodTitle || periodDescription) && (
        <div className="mb-4">
          {periodTitle && (
            <p className="text-xl font-serif font-normal text-foreground leading-snug">{periodTitle}</p>
          )}
          {periodStart && periodEnd && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(parseISO(periodStart), "MMM d")} – {format(parseISO(periodEnd), "MMM d, yyyy")}
            </p>
          )}
          {periodDescription && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{periodDescription}</p>
          )}
        </div>
      )}

      {/* 3D city + summary side by side */}
      <div className="flex gap-4 items-stretch">
        {/* City view — takes most of the width */}
        <div className="flex-1 overflow-hidden" style={{ height: 340 }}>
          <QuarterCityView
            goals={monthlyGoals}
            effort={effectiveEffort}
            selectedId={activeId}
            onSelect={(id) => setActiveId((prev) => prev === id ? null : id)}
          />
        </div>

        {/* Summary list */}
        <div className="flex flex-col justify-center gap-3 w-44 shrink-0 py-2 cursor-pointer" onClick={onOpenGoals}>
          {monthlyGoals.map((goal) => {
            const pct      = effectiveEffort.find((e) => e.goalId === goal.id)?.percentage ?? 0;
            const isActive = activeId === goal.id;
            return (
              <button
                key={goal.id}
                onClick={() => setActiveId((prev) => prev === goal.id ? null : goal.id)}
                className="text-left group focus:outline-none"
              >
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <span className="text-base font-serif leading-snug text-foreground">
                    {goal.title}
                  </span>
                  {goal.completed ? (
                    <Check className="w-3.5 h-3.5 shrink-0 text-orange-700/80" />
                  ) : (
                    <span className={`text-sm tabular-nums shrink-0 ${pct > 0 ? "text-orange-700/80" : "text-muted-foreground/50"}`}>
                      {Math.round(pct * 100)}%
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                <div className="h-0.5 w-full bg-border/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-700/50 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round(pct * 100)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {activeGoal && (
        <div className="border-t border-border/50 pt-4 mt-6">
          <p className="text-base font-serif text-foreground mb-3 font-medium">
            {activeGoal.title}
          </p>
          {weeks.length === 0 ? (
            <p className="text-sm text-muted-foreground/50 italic">No weekly goals linked yet.</p>
          ) : (
            <div className="space-y-3">
              {weeks.map(({ label, goals: wgs }) => (
                <div key={label}>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/60 mb-1">{label}</p>
                  <div className="space-y-1">
                    {wgs.map((g) => (
                      <div key={g.id} className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${g.completed ? "bg-foreground/60" : "bg-foreground/20"}`} />
                        <span className={`text-sm leading-snug ${g.completed ? "line-through text-muted-foreground" : "text-foreground/70"}`}>
                          {g.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
