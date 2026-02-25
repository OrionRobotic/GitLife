import { BaseTable } from "./BaseTable";

export interface Book extends BaseTable {
  userId: string;
  title: string;
  author: string;
  status: "reading" | "read";
  notes: string | null;
  color: string;
  height: number;
  width: number;
  borderWidth: number;
}

export interface BookCreateInput {
  title: string;
  author: string;
  status: "reading" | "read";
  color?: string;
  height?: number;
  width?: number;
  borderWidth?: number;
}

export interface BookUpdateInput extends Partial<Omit<Book, "id" | "createdAt" | "userId">> {
  id: string;
}
