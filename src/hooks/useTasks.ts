import { useState, useEffect, useCallback } from "react";
import { startOfDay } from "date-fns";
import {
  getTasks,
  createTask,
  setTaskDone,
  deleteTask,
} from "@/services/tasks";
import type { Task, TaskKind } from "@/types/database/Task";

// `tasks` stays null while loading or if the table is unavailable.
export function useTasks() {
  const [tasks, setTasks] = useState<Task[] | null>(null);

  const refresh = useCallback(async () => {
    const data = await getTasks(startOfDay(new Date()).toISOString());
    if (data) setTasks(data);
  }, []);

  useEffect(() => {
    refresh();
    // ponytail: refetch on focus picks up tasks added by the MCP assistant; realtime if that feels slow.
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  const add = async (title: string, kind: TaskKind) => {
    const task = await createTask(title, kind);
    if (task) setTasks((prev) => [...(prev ?? []), task]);
  };

  const toggle = async (task: Task) => {
    const updated = await setTaskDone(task.id, !task.done);
    if (updated)
      setTasks(
        (prev) => prev?.map((t) => (t.id === task.id ? updated : t)) ?? null
      );
  };

  const remove = async (id: string) => {
    if (await deleteTask(id))
      setTasks((prev) => prev?.filter((t) => t.id !== id) ?? null);
  };

  return { tasks, add, toggle, remove };
}
