import React, { useState, useRef, useEffect } from "react";
import { useGoals } from "@/context/useGoals";
import type { Goal, GoalType } from "@/types/database/Goal";
import { Trash2, Pencil } from "lucide-react";
import { WeeklyTorusRing } from "@/components/WeeklyTorusRing";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

function getPeriodLabel(type: GoalType): { heading: string; range: string } {
  const today = new Date();
  if (type === "weekly") {
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    return {
      heading: "This Week",
      range: `${format(start, "MMM d")} – ${format(end, "MMM d")}`,
    };
  }
  if (type === "monthly") {
    return {
      heading: format(today, "MMMM yyyy"),
      range: `${format(startOfMonth(today), "MMM d")} – ${format(endOfMonth(today), "MMM d")}`,
    };
  }
  // semester
  const month = today.getMonth() + 1;
  if (month <= 6) {
    return {
      heading: `Spring ${today.getFullYear()}`,
      range: `Jan 1 – Jun 30`,
    };
  }
  return {
    heading: `Fall ${today.getFullYear()}`,
    range: `Jul 1 – Dec 31`,
  };
}

interface GoalRowProps {
  goal: Goal;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
}

function GoalRow({ goal, onToggle, onDelete, onEdit }: GoalRowProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(goal.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitEdit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== goal.title) {
      onEdit(goal.id, trimmed);
    } else {
      setValue(goal.title);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-1">
        <input
          type="checkbox"
          checked={goal.completed}
          onChange={(e) => onToggle(goal.id, e.target.checked)}
          className="w-3.5 h-3.5 shrink-0 accent-foreground cursor-pointer"
        />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") {
              setValue(goal.title);
              setEditing(false);
            }
          }}
          onBlur={commitEdit}
          className="text-sm flex-1 bg-transparent border-b border-border outline-none text-foreground pb-0.5"
        />
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2 py-1">
      <input
        type="checkbox"
        checked={goal.completed}
        onChange={(e) => onToggle(goal.id, e.target.checked)}
        className="w-3.5 h-3.5 shrink-0 accent-foreground cursor-pointer"
      />
      <span
        onDoubleClick={() => setEditing(true)}
        className={`text-sm flex-1 cursor-default select-none ${
          goal.completed
            ? "line-through text-muted-foreground"
            : "text-foreground"
        }`}
      >
        {goal.title}
      </span>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
      >
        <Pencil className="w-3 h-3" />
      </button>
      <button
        onClick={() => onDelete(goal.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

interface AddGoalInputProps {
  type: GoalType;
  onAdd: (title: string, type: GoalType) => void;
}

function AddGoalInput({ type, onAdd }: AddGoalInputProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed, type);
    }
    setValue("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 flex items-center gap-1"
      >
        + Add goal
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") submit();
        if (e.key === "Escape") {
          setValue("");
          setOpen(false);
        }
      }}
      onBlur={submit}
      placeholder="New goal..."
      className="mt-1 text-sm w-full bg-transparent border-b border-border outline-none text-foreground placeholder:text-muted-foreground pb-0.5"
    />
  );
}

interface PeriodTitleProps {
  periodTitle: string;
  onUpdate: (title: string) => void;
}

function PeriodTitle({ periodTitle, onUpdate }: PeriodTitleProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(periodTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(periodTitle);
  }, [periodTitle]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const trimmed = value.trim();
    onUpdate(trimmed);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setValue(periodTitle);
            setEditing(false);
          }
        }}
        onBlur={commit}
        placeholder="Set a focus for this period…"
        className="text-sm w-full bg-transparent border-b border-border outline-none text-foreground placeholder:text-muted-foreground pb-0.5 mb-2 italic"
      />
    );
  }

  return (
    <p
      onClick={() => setEditing(true)}
      className={`text-sm mb-2 cursor-text select-none ${
        periodTitle ? "text-foreground" : "text-muted-foreground italic"
      }`}
    >
      {periodTitle || "Set a focus for this period…"}
    </p>
  );
}

interface GoalGroupProps {
  type: GoalType;
  goals: Goal[];
  periodTitle: string;
  onUpdatePeriodTitle: (title: string) => void;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  onAdd: (title: string, type: GoalType) => void;
}

function GoalGroup({
  type,
  goals,
  periodTitle,
  onUpdatePeriodTitle,
  onToggle,
  onDelete,
  onEdit,
  onAdd,
}: GoalGroupProps) {
  const { heading, range } = getPeriodLabel(type);
  const completed = goals.filter((g) => g.completed).length;

  return (
    <div className="py-3">
      {type === "weekly" && (
        <WeeklyTorusRing total={goals.length} completedCount={completed} />
      )}
      <div className="flex items-baseline justify-between mb-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-foreground font-serif">
            {heading}
          </span>
          <span className="text-xs text-muted-foreground">{range}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {completed}/{goals.length}
        </span>
      </div>
      <PeriodTitle periodTitle={periodTitle} onUpdate={onUpdatePeriodTitle} />
      <div className="flex flex-col">
        {goals.map((goal) => (
          <GoalRow
            key={goal.id}
            goal={goal}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
        <AddGoalInput type={type} onAdd={onAdd} />
      </div>
    </div>
  );
}

export function GoalsSection() {
  const {
    weeklyGoals,
    monthlyGoals,
    semesterGoals,
    addGoal,
    toggleGoal,
    editGoal,
    removeGoal,
    weeklyPeriodTitle,
    monthlyPeriodTitle,
    semesterPeriodTitle,
    updatePeriodTitle,
  } = useGoals();

  return (
    <div className="mt-4">
      <h2 className="text-sm font-medium text-foreground mb-1">Goals</h2>
      <div className="divide-y divide-border">
        <GoalGroup
          type="weekly"
          goals={weeklyGoals}
          periodTitle={weeklyPeriodTitle}
          onUpdatePeriodTitle={(t) => updatePeriodTitle("weekly", t)}
          onToggle={toggleGoal}
          onEdit={editGoal}
          onDelete={removeGoal}
          onAdd={addGoal}
        />
        <GoalGroup
          type="monthly"
          goals={monthlyGoals}
          periodTitle={monthlyPeriodTitle}
          onUpdatePeriodTitle={(t) => updatePeriodTitle("monthly", t)}
          onToggle={toggleGoal}
          onEdit={editGoal}
          onDelete={removeGoal}
          onAdd={addGoal}
        />
        <GoalGroup
          type="semester"
          goals={semesterGoals}
          periodTitle={semesterPeriodTitle}
          onUpdatePeriodTitle={(t) => updatePeriodTitle("semester", t)}
          onToggle={toggleGoal}
          onEdit={editGoal}
          onDelete={removeGoal}
          onAdd={addGoal}
        />
      </div>
    </div>
  );
}
