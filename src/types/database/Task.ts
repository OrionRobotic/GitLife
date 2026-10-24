import type { BaseTable } from "./BaseTable";

export interface Task extends BaseTable {
  userId: string;
  title: string;
  done: boolean;
  dueDate: string | null;
  completedAt: string | null;
  updatedAt: string;
}
