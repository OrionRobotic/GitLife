import React, { useState, useRef, useEffect } from "react";
import { useGoals } from "@/context/useGoals";
import type { Goal, GoalType } from "@/types/database/Goal";
import { Trash2, Pencil, Link2 } from "lucide-react";
import { WeeklyTorusRing } from "@/components/WeeklyTorusRing";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

// Tab definitions: display label maps to existing GoalType values
const DIALOG_TABS = [
  { key: "weekly" as GoalType,  label: "Week" },
  { key: "monthly" as GoalType, label: "Quarter" },
];

function getPeriodRange(type: GoalType): string {
  const today = new Date();
  if (type === "weekly") {
    const s = startOfWeek(today, { weekStartsOn: 1 });
    const e = endOfWeek(today, { weekStartsOn: 1 });
    return `${format(s, "MMM d")} – ${format(e, "MMM d")}`;
  }
  if (type === "monthly") {
    const m = today.getMonth(), y = today.getFullYear();
    if (m < 3)  return `Jan 1 – Mar 31, ${y}`;
    if (m < 6)  return `Apr 1 – Jun 30, ${y}`;
    if (m < 9)  return `Jul 1 – Sep 30, ${y}`;
    return `Oct 1 – Dec 31, ${y}`;
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
  monthlyGoals,
  onLink,
}: {
  goal: Goal;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  monthlyGoals?: Goal[];
  onLink?: (id: string, linkedGoalId: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(goal.title);
  const [linkOpen, setLinkOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const linkRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  // Close link dropdown on outside click or Escape
  useEffect(() => {
    if (!linkOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLinkOpen(false); };
    const onClickOutside = (e: MouseEvent) => {
      if (linkRef.current && !linkRef.current.contains(e.target as Node)) setLinkOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [linkOpen]);

  const commitEdit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== goal.title) onEdit(goal.id, trimmed);
    else setValue(goal.title);
    setEditing(false);
  };

  const linkedGoal = monthlyGoals?.find((mg) => mg.id === goal.linkedGoalId);

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

      {/* Link selector (weekly goals only, when monthlyGoals + onLink provided) */}
      {monthlyGoals && onLink && (
        <div ref={linkRef} className="relative shrink-0">
          <button
            onClick={() => setLinkOpen((v) => !v)}
            title={linkedGoal ? `Linked to: ${linkedGoal.title}` : "Link to quarter goal"}
            className={`transition-opacity ${
              linkedGoal
                ? "text-orange-400/80 opacity-100"
                : "opacity-0 group-hover:opacity-60 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Link2 className="w-3 h-3" />
          </button>
          {linkOpen && (
            <div className="absolute right-0 top-5 z-20 bg-background border border-border rounded-md shadow-lg py-1 min-w-[160px] max-w-[220px]">
              <button
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors ${
                  !goal.linkedGoalId ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
                onClick={() => { onLink(goal.id, null); setLinkOpen(false); }}
              >
                None
              </button>
              {monthlyGoals.map((mg) => (
                <button
                  key={mg.id}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors truncate ${
                    goal.linkedGoalId === mg.id ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                  onClick={() => { onLink(goal.id, mg.id); setLinkOpen(false); }}
                >
                  {mg.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
  monthlyGoals,
  onLink,
  periodStart,
  periodEnd,
  onChangePeriodStart,
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
  monthlyGoals?: Goal[];
  onLink?: (id: string, linkedGoalId: string | null) => void;
  periodStart?: string;
  periodEnd?: string;
  onChangePeriodStart?: (date: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [descValue, setDescValue] = useState(periodDescription);

  useEffect(() => { setDescValue(periodDescription); }, [periodDescription]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; }
  }, [descValue]);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const rangeLabel = periodStart && periodEnd
    ? `${format(parseISO(periodStart), "MMM d")} – ${format(parseISO(periodEnd), "MMM d, yyyy")}`
    : getPeriodRange(type);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs text-muted-foreground">{rangeLabel}</p>
          {type === "monthly" && onChangePeriodStart && (
            <>
              <button
                type="button"
                onClick={() => dateInputRef.current?.showPicker?.()}
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                title="Change quarter start date"
              >
                ✎
              </button>
              <input
                ref={dateInputRef}
                type="date"
                defaultValue={periodStart ?? ""}
                onChange={(e) => { if (e.target.value) onChangePeriodStart(e.target.value); }}
                className="sr-only"
              />
            </>
          )}
        </div>
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
              monthlyGoals={type === "weekly" ? monthlyGoals : undefined}
              onLink={type === "weekly" ? onLink : undefined}
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

// ── WeekInfoPanel — always-visible side panel next to torus ───────────────────

function WeekInfoPanel({
  title, description, goals,
}: {
  title: string; description: string; goals: Goal[];
}) {
  return (
    <div className="flex flex-col min-w-0">
      {description && (
        <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-3">{description}</p>
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
  initialTab,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  initialTab?: GoalType;
}) {
  const {
    weeklyGoals,
    monthlyGoals,
    semesterGoals,
    addGoal,
    toggleGoal,
    editGoal,
    removeGoal,
    linkGoal,
    weeklyPeriodTitle,
    monthlyPeriodTitle,
    semesterPeriodTitle,
    weeklyPeriodDescription,
    monthlyPeriodDescription,
    semesterPeriodDescription,
    updatePeriod,
    updateMonthlyPeriodStart,
    monthlyPeriodStart,
    monthlyPeriodEnd,
    quarterEffort,
  } = useGoals();

  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen    = open    ?? internalOpen;
  const setDialogOpen = onOpenChange ?? setInternalOpen;

  const [dialogTab, setDialogTab] = useState<GoalType>(initialTab ?? "weekly");
  useEffect(() => { if (open && initialTab) setDialogTab(initialTab); }, [open, initialTab]);


  const goalsForTab =
    dialogTab === "weekly" ? weeklyGoals : dialogTab === "monthly" ? monthlyGoals : semesterGoals;
  const titleForTab =
    dialogTab === "weekly" ? weeklyPeriodTitle : dialogTab === "monthly" ? monthlyPeriodTitle : semesterPeriodTitle;
  const descForTab =
    dialogTab === "weekly" ? weeklyPeriodDescription : dialogTab === "monthly" ? monthlyPeriodDescription : semesterPeriodDescription;

  return (
    <div>
      <h2 className="text-xl font-normal text-foreground font-serif tracking-tight leading-snug">
        {weeklyPeriodTitle || "This week"}
      </h2>
      <p className="text-xs text-muted-foreground mt-0.5 mb-1">{getPeriodRange("weekly")}</p>

      {/* Info panel (left) + Torus (right) */}
      <div
        className="flex items-start gap-4 cursor-pointer"
        onClick={() => { setDialogTab("weekly"); setDialogOpen(true); }}
      >
        <div className="flex-1 min-w-0 pl-6 pt-2">
          <WeekInfoPanel
            title={weeklyPeriodTitle}
            description={weeklyPeriodDescription}
            goals={weeklyGoals}
          />
        </div>
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
                monthlyGoals={dialogTab === "weekly" ? monthlyGoals : undefined}
                onLink={dialogTab === "weekly" ? linkGoal : undefined}
                periodStart={dialogTab === "monthly" ? monthlyPeriodStart : undefined}
                periodEnd={dialogTab === "monthly" ? monthlyPeriodEnd : undefined}
                onChangePeriodStart={dialogTab === "monthly" ? updateMonthlyPeriodStart : undefined}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
