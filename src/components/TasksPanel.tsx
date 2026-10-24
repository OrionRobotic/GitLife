import { useState, type FormEvent } from "react";
import { useTasks } from "@/hooks/useTasks";
import type { Task, TaskKind } from "@/types/database/Task";

const COLUMNS: { kind: TaskKind; label: string }[] = [
  { kind: "short", label: "Short" },
  { kind: "long", label: "Long" },
];

function TaskColumn({
  kind,
  label,
  tasks,
  onAdd,
  onToggle,
  onRemove,
}: {
  kind: TaskKind;
  label: string;
  tasks: Task[];
  onAdd: (title: string, kind: TaskKind) => void;
  onToggle: (task: Task) => void;
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
          <li
            key={task.id}
            className={`group flex items-center gap-2 py-1 ${task.done ? "opacity-40" : ""}`}
          >
            <input
              id={`task-${task.id}`}
              type="checkbox"
              checked={task.done}
              onChange={() => onToggle(task)}
              aria-label={`${task.done ? "Mark not done" : "Mark done"}: ${task.title}`}
              className="appearance-none shrink-0 w-3 h-3 rounded-full border border-foreground/40 cursor-pointer checked:bg-[#D97757] checked:border-[#D97757]"
            />
            <label
              htmlFor={`task-${task.id}`}
              className={`flex-1 min-w-0 truncate text-sm cursor-pointer ${task.done ? "line-through" : "text-foreground"}`}
            >
              {task.title}
            </label>
            <button
              type="button"
              onClick={() => onRemove(task.id)}
              aria-label={`Delete task: ${task.title}`}
              className="text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            >
              ×
            </button>
          </li>
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
  const { tasks, add, toggle, remove } = useTasks();

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
          onRemove={remove}
        />
      ))}
    </section>
  );
}
