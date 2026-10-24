import { useState, useRef, useEffect } from "react";
import { useGoals } from "@/context/useGoals";
import type { Goal, GoalType } from "@/types/database/Goal";
import { Trash2, Pencil } from "lucide-react";
import { WeeklyTorusRing } from "@/components/WeeklyTorusRing";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, startOfWeek, endOfWeek } from "date-fns";

function getWeekRange(): string {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const end = endOfWeek(today, { weekStartsOn: 1 });
  return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
}

// ── GoalRow ───────────────────────────────────────────────────────────────────

function GoalRow({
  goal,
  onToggle,
  onDelete,
  onEdit,
}: {
  goal: Goal;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(goal.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitEdit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== goal.title) onEdit(goal.id, trimmed);
    else setValue(goal.title);
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

// ── AddGoalInput ──────────────────────────────────────────────────────────────

function AddGoalInput({
  type,
  onAdd,
}: {
  type: GoalType;
  onAdd: (title: string, type: GoalType) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed) onAdd(trimmed, type);
    setValue("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
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

// ── EditableTitle ─────────────────────────────────────────────────────────────

function EditableTitle({
  value: externalValue,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(externalValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(externalValue);
  }, [externalValue]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    onSave(value.trim());
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
            setValue(externalValue);
            setEditing(false);
          }
        }}
        onBlur={commit}
        placeholder="Set a focus…"
        className="w-full text-xl font-serif bg-transparent border-b border-border outline-none text-foreground placeholder:text-muted-foreground pb-0.5"
      />
    );
  }

  return (
    <p
      onClick={() => setEditing(true)}
      className={`text-xl font-serif cursor-text select-none ${
        externalValue ? "text-foreground" : "text-muted-foreground italic"
      }`}
    >
      {externalValue || "Set a focus…"}
    </p>
  );
}

// ── WeekContent ────────────────────────────────────────────────────────

function WeekContent({
  goals,
  periodTitle,
  periodDescription,
  onUpdatePeriod,
  onToggle,
  onDelete,
  onEdit,
  onAdd,
}: {
  goals: Goal[];
  periodTitle: string;
  periodDescription: string;
  onUpdatePeriod: (updates: { title: string; description: string }) => void;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  onAdd: (title: string, type: GoalType) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [descValue, setDescValue] = useState(periodDescription);

  useEffect(() => {
    setDescValue(periodDescription);
  }, [periodDescription]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    }
  }, [descValue]);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs text-muted-foreground">{getWeekRange()}</p>
        </div>
        <EditableTitle
          value={periodTitle}
          onSave={(title) => onUpdatePeriod({ title, description: descValue })}
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground uppercase tracking-wide">
          Description
        </label>
        <textarea
          ref={textareaRef}
          value={descValue}
          onChange={(e) => setDescValue(e.target.value)}
          onBlur={() =>
            onUpdatePeriod({
              title: periodTitle,
              description: descValue.trim(),
            })
          }
          placeholder="What does this period mean to you?"
          rows={2}
          className="mt-1 w-full text-sm bg-transparent border-b border-border outline-none text-foreground placeholder:text-muted-foreground pb-0.5 resize-none overflow-hidden leading-relaxed"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">
            Goals
          </label>
          <span className="text-xs text-muted-foreground">
            {goals.filter((g) => g.completed).length}/{goals.length}
          </span>
        </div>
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
          <AddGoalInput type="weekly" onAdd={onAdd} />
        </div>
      </div>
    </div>
  );
}

// ── WeekInfoPanel — always-visible side panel next to torus ───────────────────

function WeekInfoPanel({
  description, goals,
}: {
  description: string; goals: Goal[];
}) {
  return (
    <div className="flex flex-col min-w-0">
      {description && (
        <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-3">
          {description}
        </p>
      )}
      {goals.length > 0 && (
        <div className="mt-3 flex flex-col gap-1">
          {goals.map((g) => (
            <p
              key={g.id}
              className={`text-xs leading-snug ${g.completed ? "text-foreground" : "text-foreground/35"}`}
            >
              {g.title}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── GoalsSection ──────────────────────────────────────────────────────────────

export function GoalsSection({
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const {
    weeklyGoals,
    addGoal,
    toggleGoal,
    editGoal,
    removeGoal,
    weeklyPeriodTitle,
    weeklyPeriodDescription,
    updatePeriod,
  } = useGoals();

  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen = open ?? internalOpen;
  const setDialogOpen = onOpenChange ?? setInternalOpen;

  return (
    <div>
      <h2 className="text-xl font-normal text-foreground font-serif tracking-tight leading-snug">
        {weeklyPeriodTitle || "This week"}
      </h2>
      <p className="text-xs text-muted-foreground mt-0.5 mb-1">{getWeekRange()}</p>

      {/* Info panel (left) + Torus (right) */}
      <div
        className="flex items-start justify-center gap-4 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label="Edit weekly goals"
        onClick={() => setDialogOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setDialogOpen(true);
          }
        }}
      >
        {(weeklyPeriodDescription || weeklyGoals.length > 0) && (
          <div className="flex-1 min-w-0 pl-6 pt-2">
            <WeekInfoPanel
              description={weeklyPeriodDescription}
              goals={weeklyGoals}
            />
          </div>
        )}
        <div className="shrink-0" style={{ width: "55%" }}>
          <WeeklyTorusRing goals={weeklyGoals} onHoverChange={() => {}} />
        </div>
      </div>

      {/* Goals dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif font-normal text-xl tracking-tight">
              Sit, Think and Write Down.
            </DialogTitle>
          </DialogHeader>

          <div className="pt-2 pb-1">
            <WeekContent
              goals={weeklyGoals}
              periodTitle={weeklyPeriodTitle}
              periodDescription={weeklyPeriodDescription}
              onUpdatePeriod={(updates) => updatePeriod("weekly", updates)}
              onToggle={toggleGoal}
              onDelete={removeGoal}
              onEdit={editGoal}
              onAdd={addGoal}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
