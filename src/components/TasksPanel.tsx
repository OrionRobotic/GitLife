import { useState, type FormEvent } from "react";
import { useTasks } from "@/hooks/useTasks";

const ACCENT = "#D97757";
const R = 14;
const C = 2 * Math.PI * R;

// Segmented ring, one segment per task in today's list, done ones in orange.
function TaskGauge({ done, total }: { done: number; total: number }) {
  const n = Math.max(total, 1);
  const step = C / n;
  const gap = Math.min(2, step * 0.3);
  return (
    <svg
      viewBox="0 0 40 40"
      className="w-10 h-10 -rotate-90"
      role="img"
      aria-label={`${done} of ${total} tasks done today`}
    >
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1="20"
          y1="1"
          x2="20"
          y2={i % 3 === 0 ? 4 : 2.5}
          transform={`rotate(${i * 30} 20 20)`}
          className="stroke-foreground/40"
          strokeWidth="0.6"
        />
      ))}
      {Array.from({ length: n }, (_, i) => (
        <circle
          key={i}
          cx="20"
          cy="20"
          r={R}
          fill="none"
          strokeWidth="3"
          stroke={i < done ? ACCENT : "hsl(var(--muted))"}
          strokeDasharray={`${step - gap} ${C}`}
          strokeDashoffset={-i * step}
        />
      ))}
      <circle
        cx="20"
        cy="20"
        r="10"
        fill="none"
        className="stroke-foreground/30"
        strokeWidth="0.5"
      />
    </svg>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

export function TasksPanel() {
  const { tasks, add, toggle, remove } = useTasks();
  const [title, setTitle] = useState("");

  // Hidden while loading or if the tasks table is unavailable.
  if (!tasks) return null;

  const sorted = [...tasks].sort((a, b) => Number(a.done) - Number(b.done));
  const done = tasks.filter((t) => t.done).length;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    add(value);
    setTitle("");
  };

  return (
    <section
      aria-labelledby="tasks-heading"
      className="p-6 bg-card border border-border rounded-lg"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2
            id="tasks-heading"
            className="text-sm font-medium text-foreground"
          >
            Tasks
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {pad(tasks.length - done)} pending
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {pad(done)}/{pad(tasks.length)}
          </span>
          <TaskGauge done={done} total={tasks.length} />
        </div>
      </div>

      {/* Ruler: minor ticks every 6px, major every 30px */}
      <div
        aria-hidden
        className="mt-3 h-2 border-b border-foreground/30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, hsl(var(--foreground) / 0.35) 0 1px, transparent 1px 30px), repeating-linear-gradient(90deg, hsl(var(--foreground) / 0.2) 0 1px, transparent 1px 6px)",
          backgroundSize: "100% 100%, 100% 50%",
          backgroundPosition: "bottom, bottom",
          backgroundRepeat: "no-repeat",
        }}
      />

      <ul>
        {sorted.map((task, i) => (
          <li
            key={task.id}
            className={`group flex items-center gap-3 py-1.5 border-b border-dashed border-border ${task.done ? "opacity-50" : ""}`}
          >
            <span className="font-mono text-[10px] text-muted-foreground tabular-nums w-4">
              {pad(i + 1)}
            </span>
            <input
              id={`task-${task.id}`}
              type="checkbox"
              checked={task.done}
              onChange={() => toggle(task)}
              aria-label={`${task.done ? "Mark not done" : "Mark done"}: ${task.title}`}
              className="appearance-none shrink-0 w-3.5 h-3.5 rounded-[2px] border border-foreground/50 cursor-pointer checked:bg-[#D97757] checked:border-[#D97757] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2"
            />
            <label
              htmlFor={`task-${task.id}`}
              className={`flex-1 min-w-0 truncate text-sm cursor-pointer ${task.done ? "line-through decoration-[#D97757]" : "text-foreground"}`}
            >
              {task.title}
            </label>
            <button
              type="button"
              onClick={() => remove(task.id)}
              aria-label={`Delete task: ${task.title}`}
              title="Delete task"
              className="font-mono text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="flex items-center gap-3 pt-2">
        <span className="font-mono text-[10px] text-muted-foreground w-4">
          +
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add task…"
          aria-label="Add task"
          className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded-[2px] px-1.5 py-0.5 hover:text-foreground disabled:opacity-40"
        >
          Add task
        </button>
      </form>
    </section>
  );
}
