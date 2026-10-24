import { supabase } from "@/lib/supabase";
import type { Task } from "@/types/database/Task";

export async function createTask(title: string): Promise<Task | null> {
  try {
    // userId defaults to auth.uid() in the database.
    const { data, error } = await supabase
      .from("tasks")
      .insert([{ title }])
      .select()
      .single();

    if (error) {
      console.error("Error creating task:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error creating task:", error);
    return null;
  }
}
