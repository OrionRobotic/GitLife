import { useRef, useState, type FormEvent } from "react";
import { Calendar } from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useTasks } from "@/hooks/useTasks";
import type { Task, TaskKind } from "@/types/database/Task";

const COLUMNS: { kind: TaskKind; label: string }[] = [
  { kind: "short", label: "Short" },
  { kind: "long", label: "Long" },
];

// Pending task due (or overdue) within 2 days.
const isDueSoon = (task: Task) =>
  !task.done &&
  !!task.dueDate &&
  differenceInCalendarDays(parseISO(task.dueDate), new Date()) <= 2;

type Edit = (
  id: string,
  fields: Partial<Pick<Task, "title" | "dueDate">>
) => void;

function TaskItem({
  task,
  onToggle,
  onEdit,
  onRemove,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: Edit;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const urgent = isDueSoon(task) ? "font-bold text-[#722F37]" : "";

  const save = () => {
    const value = draft?.trim();
    if (value && value !== task.title) onEdit(task.id, { title: value });
    setDraft(null);
  };

  return (
    <li
      className={`group flex items-center gap-2 py-1 ${task.done ? "opacity-40" : ""}`}
    >
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => onToggle(task)}
        aria-label={`${task.done ? "Mark not done" : "Mark done"}: ${task.title}`}
        className="appearance-none shrink-0 w-3 h-3 rounded-full border border-foreground/40 cursor-pointer checked:bg-[#D97757] checked:border-[#D97757]"
      />
      {draft === null ? (
        <button
          type="button"
          onClick={() => setDraft(task.title)}
          aria-label={`Edit task: ${task.title}`}
          className={`flex-1 min-w-0 truncate text-left text-sm cursor-text ${task.done ? "line-through" : "text-foreground"} ${urgent}`}
        >
          {task.title}
        </button>
      ) : (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setDraft(null);
          }}
          aria-label="Task title"
          className="flex-1 min-w-0 bg-transparent text-sm text-foreground outline-none border-b border-foreground/20"
        />
      )}
      {/* WebKit (desktop app) has no native picker icon: draw our own everywhere. */}
      <span
        className={`shrink-0 flex items-center gap-1 ${task.dueDate ? "" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"}`}
      >
        <input
          ref={dateRef}
          type="date"
          value={task.dueDate ?? ""}
          onChange={(e) => onEdit(task.id, { dueDate: e.target.value || null })}
          aria-label={`Deadline: ${task.title}`}
          className={`bg-transparent text-xs text-muted-foreground outline-none [&::-webkit-calendar-picker-indicator]:hidden ${urgent}`}
        />
        <button
          type="button"
          onClick={() => dateRef.current?.showPicker?.()}
          aria-label={`Pick deadline: ${task.title}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <Calendar className="w-3.5 h-3.5" />
        </button>
      </span>
      <button
        type="button"
        onClick={() => onRemove(task.id)}
        aria-label={`Delete task: ${task.title}`}
        className="text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      >
        ×
      </button>
    </li>
  );
}

function TaskColumn({
  kind,
  label,
  tasks,
  onAdd,
  onToggle,
  onEdit,
  onRemove,
}: {
  kind: TaskKind;
  label: string;
  tasks: Task[];
  onAdd: (title: string, kind: TaskKind) => void;
  onToggle: (task: Task) => void;
  onEdit: Edit;
  onRemove: (id: string) => void;
}) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    onAdd(value, kind);
    setTitle("");
  };

  return (
    <div className="min-w-0">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
        {label}
      </h3>
      <ul>
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggle}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`+ ${label.toLowerCase()} task`}
          aria-label={`Add ${label.toLowerCase()} task`}
          className="w-full py-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
        />
      </form>
    </div>
  );
}

export function TasksPanel() {
  const { tasks, add, toggle, edit, remove } = useTasks();

  // Hidden while loading or if the tasks table is unavailable.
  if (!tasks) return null;

  const sorted = [...tasks].sort((a, b) => Number(a.done) - Number(b.done));

  return (
    <section aria-label="Tasks" className="grid grid-cols-2 gap-8 px-2">
      {COLUMNS.map(({ kind, label }) => (
        <TaskColumn
          key={kind}
          kind={kind}
          label={label}
          // Rows without kind (before the migration) count as short.
          tasks={sorted.filter((t) => (t.kind ?? "short") === kind)}
          onAdd={add}
          onToggle={toggle}
          onEdit={edit}
          onRemove={remove}
        />
      ))}
    </section>
  );
}
