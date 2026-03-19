import React, { useState, useRef, useEffect } from "react";
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
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

// Tab definitions: display label maps to existing GoalType values
const DIALOG_TABS = [
  { key: "weekly" as GoalType,   label: "Week" },
  { key: "monthly" as GoalType,  label: "Quarter" },
  { key: "semester" as GoalType, label: "Year" },
];

function getPeriodRange(type: GoalType): string {
  const today = new Date();
  if (type === "weekly") {
    const s = startOfWeek(today, { weekStartsOn: 1 });
    const e = endOfWeek(today, { weekStartsOn: 1 });
    return `${format(s, "MMM d")} – ${format(e, "MMM d")}`;
  }
  if (type === "monthly") {
    return `${format(startOfMonth(today), "MMM d")} – ${format(endOfMonth(today), "MMM d")}`;
  }
  const month = today.getMonth() + 1;
  return month <= 6 ? `Jan 1 – Jun 30, ${today.getFullYear()}` : `Jul 1 – Dec 31, ${today.getFullYear()}`;
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

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

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
            if (e.key === "Escape") { setValue(goal.title); setEditing(false); }
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
          goal.completed ? "line-through text-muted-foreground" : "text-foreground"
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

function AddGoalInput({ type, onAdd }: { type: GoalType; onAdd: (title: string, type: GoalType) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

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
        if (e.key === "Escape") { setValue(""); setOpen(false); }
      }}
      onBlur={submit}
      placeholder="New goal..."
      className="mt-1 text-sm w-full bg-transparent border-b border-border outline-none text-foreground placeholder:text-muted-foreground pb-0.5"
    />
  );
}

// ── EditableTitle ─────────────────────────────────────────────────────────────

function EditableTitle({ value: externalValue, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(externalValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setValue(externalValue); }, [externalValue]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => { onSave(value.trim()); setEditing(false); };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setValue(externalValue); setEditing(false); }
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

// ── WeekQuarterContent ────────────────────────────────────────────────────────

function WeekQuarterContent({
  type,
  goals,
  periodTitle,
  periodDescription,
  onUpdatePeriod,
  onToggle,
  onDelete,
  onEdit,
  onAdd,
}: {
  type: GoalType;
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

  useEffect(() => { setDescValue(periodDescription); }, [periodDescription]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; }
  }, [descValue]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-muted-foreground mb-2">{getPeriodRange(type)}</p>
        <EditableTitle
          value={periodTitle}
          onSave={(title) => onUpdatePeriod({ title, description: descValue })}
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground uppercase tracking-wide">Description</label>
        <textarea
          ref={textareaRef}
          value={descValue}
          onChange={(e) => setDescValue(e.target.value)}
          onBlur={() => onUpdatePeriod({ title: periodTitle, description: descValue.trim() })}
          placeholder="What does this period mean to you?"
          rows={2}
          className="mt-1 w-full text-sm bg-transparent border-b border-border outline-none text-foreground placeholder:text-muted-foreground pb-0.5 resize-none overflow-hidden leading-relaxed"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Goals</label>
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
          <AddGoalInput type={type} onAdd={onAdd} />
        </div>
      </div>
    </div>
  );
}

// ── YearContent ───────────────────────────────────────────────────────────────

function YearContent({
  periodTitle,
  periodDescription,
  onUpdatePeriod,
}: {
  periodTitle: string;
  periodDescription: string;
  onUpdatePeriod: (updates: { title: string; description: string }) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [descValue, setDescValue] = useState(periodDescription);

  useEffect(() => { setDescValue(periodDescription); }, [periodDescription]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; }
  }, [descValue]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-muted-foreground mb-2">{getPeriodRange("semester")}</p>
        <EditableTitle
          value={periodTitle}
          onSave={(title) => onUpdatePeriod({ title, description: descValue })}
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground uppercase tracking-wide">Reflection</label>
        <textarea
          ref={textareaRef}
          value={descValue}
          onChange={(e) => setDescValue(e.target.value)}
          onBlur={() => onUpdatePeriod({ title: periodTitle, description: descValue.trim() })}
          placeholder="What do you want this year to stand for?"
          rows={5}
          className="mt-1 w-full text-sm bg-transparent border-b border-border outline-none text-foreground placeholder:text-muted-foreground pb-0.5 resize-none overflow-hidden leading-relaxed"
        />
      </div>
    </div>
  );
}

// ── TorusPopup ────────────────────────────────────────────────────────────────

function TorusPopup({
  title, description, goals, x, y,
}: {
  title: string; description: string; goals: Goal[]; x: number; y: number;
}) {
  return (
    <div
      className="absolute z-10 bg-background border border-border rounded-lg px-4 py-3 shadow-lg pointer-events-none min-w-[180px] max-w-[240px]"
      style={{ left: x, top: y }}
    >
      <p className="text-base font-medium font-serif text-foreground leading-snug">
        {title || "This Week"}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 leading-snug">{description}</p>
      )}
      {goals.length > 0 && (
        <div className="mt-2.5 flex flex-col gap-1">
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
    weeklyPeriodDescription,
    monthlyPeriodDescription,
    semesterPeriodDescription,
    updatePeriod,
  } = useGoals();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<GoalType>("weekly");
  const [torusHovered, setTorusHovered] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const torusWrapRef = useRef<HTMLDivElement>(null);

  const handleHoverChange = (hovering: boolean, clientX: number, clientY: number) => {
    setTorusHovered(hovering);
    if (hovering && torusWrapRef.current) {
      const rect = torusWrapRef.current.getBoundingClientRect();
      setPopupPos({ x: clientX - rect.left + 16, y: clientY - rect.top - 20 });
    }
  };

  const goalsForTab =
    dialogTab === "weekly" ? weeklyGoals : dialogTab === "monthly" ? monthlyGoals : semesterGoals;
  const titleForTab =
    dialogTab === "weekly" ? weeklyPeriodTitle : dialogTab === "monthly" ? monthlyPeriodTitle : semesterPeriodTitle;
  const descForTab =
    dialogTab === "weekly" ? weeklyPeriodDescription : dialogTab === "monthly" ? monthlyPeriodDescription : semesterPeriodDescription;

  return (
    <div className="mt-4">
      <h2 className="text-lg font-normal text-foreground font-serif tracking-tight mb-1">Goals</h2>

      {/* Torus with hover popup — click to open goals dialog */}
      <div
        className="relative cursor-pointer"
        ref={torusWrapRef}
        onClick={() => { setDialogTab("weekly"); setDialogOpen(true); }}
      >
        <WeeklyTorusRing goals={weeklyGoals} onHoverChange={handleHoverChange} />
        {torusHovered && (
          <TorusPopup
            title={weeklyPeriodTitle}
            description={weeklyPeriodDescription}
            goals={weeklyGoals}
            x={popupPos.x}
            y={popupPos.y}
          />
        )}
      </div>

      {/* CTA button */}
      <button
        onClick={() => setDialogOpen(true)}
        className="mt-2 w-full py-2.5 text-sm text-muted-foreground italic border border-border/60 rounded-lg hover:text-foreground hover:border-border transition-colors"
      >
        Sit, Think and Write Down.
      </button>

      {/* Goals dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif font-normal text-xl tracking-tight">
              Sit, Think and Write Down.
            </DialogTitle>
          </DialogHeader>

          {/* Tab bar */}
          <div className="flex gap-0 border-b border-border -mt-1">
            {DIALOG_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setDialogTab(t.key)}
                className={`px-4 py-2 text-sm transition-colors ${
                  dialogTab === t.key
                    ? "text-foreground border-b-2 border-foreground -mb-px font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="pt-2 pb-1">
            {dialogTab === "semester" ? (
              <YearContent
                periodTitle={semesterPeriodTitle}
                periodDescription={semesterPeriodDescription}
                onUpdatePeriod={(u) => updatePeriod("semester", u)}
              />
            ) : (
              <WeekQuarterContent
                type={dialogTab}
                goals={goalsForTab}
                periodTitle={titleForTab}
                periodDescription={descForTab}
                onUpdatePeriod={(u) => updatePeriod(dialogTab, u)}
                onToggle={toggleGoal}
                onDelete={removeGoal}
                onEdit={editGoal}
                onAdd={addGoal}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
