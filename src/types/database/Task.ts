import type { BaseTable } from "./BaseTable";

export type TaskKind = "short" | "long";

export interface Task extends BaseTable {
  userId: string;
  title: string;
  kind: TaskKind;
  done: boolean;
  dueDate: string | null;
  completedAt: string | null;
  updatedAt: string;
}
