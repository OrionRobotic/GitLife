import type { BaseTable } from "./BaseTable";

export type GoalType = "weekly" | "monthly" | "semester";

export interface Goal extends BaseTable {
  userId: string;
  title: string;
  description?: string;
  type: GoalType;
  periodStart: string;
  periodEnd: string;
  completed: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface GoalCreateInput {
  title: string;
  type: GoalType;
  periodStart: string;
  periodEnd: string;
}

export interface GoalUpdateInput {
  title?: string;
  completed?: boolean;
  sortOrder?: number;
}

export interface GoalPeriod extends BaseTable {
  userId: string;
  type: GoalType;
  periodStart: string;
  periodEnd: string;
  title: string;
  updatedAt: string;
}

export interface GoalPeriodUpsertInput {
  type: GoalType;
  periodStart: string;
  periodEnd: string;
  title: string;
}
