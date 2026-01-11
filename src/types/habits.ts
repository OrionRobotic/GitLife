export interface DayEntry {
  workout: number;
  eating: number;
  reading: number;
  sleep: number;
}

export interface HabitData {
  [date: string]: DayEntry;
}

export interface Habit {
  id: string; // UUID
  createdAt: string; // ISO timestamp (e.g., "2023-01-01T12:00:00Z")
  name: string;
}

export interface HabitLog {
  id: string; // UUID
  habitId: string; // Foreign key to habits.id
  userId: string; // Foreign key to auth.users.id
  createdAt: string; // ISO timestamp (e.g., "2023-01-01T12:00:00Z")
}

export interface HabitWithLogs extends Habit {
  logs?: HabitLog[];
}

export interface HabitLogWithHabit extends HabitLog {
  habit?: Habit;
}

export interface HabitCreateInput {
  name: string;
}

export interface HabitUpdateInput extends Partial<HabitCreateInput> {
  id: string;
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

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  status: number;
}

export namespace Supabase {
  export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

  export interface Database {
    public: {
      Tables: {
        habits: {
          Row: Habit;
          Insert: Omit<Habit, "id" | "createdAt"> & { id?: string };
          Update: Partial<Habit> & { id: string };
        };
        habitsLogs: {
          Row: HabitLog;
          Insert: Omit<HabitLog, "id" | "createdAt"> & { id?: string };
          Update: Partial<HabitLog> & { id: string };
        };
      };
      Views: {
        // Add any database views here
      };
      Functions: {
        // Add any database functions here
      };
    };
  }
}
