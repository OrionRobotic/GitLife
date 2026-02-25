import { BaseTable } from "./BaseTable";

export interface Blog extends BaseTable {
  userId: string;
  title: string;
  content: string;
  updatedAt: string;
  labelName: string | null;
  labelColor: string | null;
}

export interface BlogCreateInput {
  title: string;
  content: string;
  labelName?: string | null;
  labelColor?: string | null;
}

export interface BlogUpdateInput {
  id: string;
  title?: string;
  content?: string;
}
