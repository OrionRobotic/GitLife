import { supabase } from "@/lib/supabase";
import type { Task } from "@/types/database/Task";

export async function setTaskDone(
  id: string,
  done: boolean
): Promise<Task | null> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("tasks")
      .update({ done, completedAt: done ? now : null, updatedAt: now })
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
