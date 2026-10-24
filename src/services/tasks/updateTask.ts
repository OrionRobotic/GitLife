import { supabase } from "@/lib/supabase";
import type { Task } from "@/types/database/Task";

export async function updateTask(
  id: string,
  fields: Partial<Pick<Task, "title" | "dueDate">>
): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .update({ ...fields, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating task:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error updating task:", error);
    return null;
  }
}
