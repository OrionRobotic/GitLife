export type { BaseTable } from "./BaseTable";
export type { Habit, HabitCreateInput, HabitUpdateInput } from "./Habit";
export type {
  HabitLog,
  HabitLogCreateInput,
  HabitLogUpdateInput,
} from "./HabitLog";

import type { Habit as HabitType } from "./Habit";
import type { HabitLog as HabitLogType } from "./HabitLog";

// Extended types with relationships
export interface HabitWithLogs extends HabitType {
  logs?: HabitLogType[];
}

export interface HabitLogWithHabit extends HabitLogType {
  habit?: HabitType;
}

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  status: number;
}
