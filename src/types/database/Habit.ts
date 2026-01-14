import { BaseTable } from "./BaseTable";

export interface Habit extends BaseTable {
  name: string;
}

export interface HabitCreateInput {
  name: string;
}

export interface HabitUpdateInput extends Partial<HabitCreateInput> {
  id: string;
}
