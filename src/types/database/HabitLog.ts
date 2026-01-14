import { BaseTable } from "./BaseTable";

export interface HabitLog extends BaseTable {
  habitId: string; // Foreign key to habits.id
  userId: string; // Foreign key to auth.users.id
}

export interface HabitLogCreateInput {
  habitId: string;
  userId: string;
}

export interface HabitLogUpdateInput extends Partial<
  Omit<HabitLogCreateInput, "habitId" | "userId">
> {
  id: string;
}
