import { BaseTable } from "./BaseTable";

export interface Book extends BaseTable {
  userId: string;
  title: string;
  author: string;
  status: "reading" | "read";
  notes: string | null;
  /** User rating 1–5, null if not rated */
  rating: number | null;
  color: string;
  height: number;
  width: number;
  borderWidth: number;
}

export interface BookCreateInput {
  title: string;
  author: string;
  status: "reading" | "read";
  rating?: number | null;
  color?: string;
  height?: number;
  width?: number;
  borderWidth?: number;
}

export interface BookUpdateInput extends Partial<Omit<Book, "id" | "createdAt" | "userId">> {
  id: string;
}
