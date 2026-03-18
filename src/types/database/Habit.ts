import { BaseTable } from "./BaseTable";

export interface Habit extends BaseTable {
  name: string;
  icon?: string;
}

export interface HabitCreateInput {
  name: string;
  icon?: string;
}

export interface HabitUpdateInput extends Partial<HabitCreateInput> {
  id: string;
}
