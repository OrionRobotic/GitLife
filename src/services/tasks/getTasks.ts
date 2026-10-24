import { supabase } from "@/lib/supabase";
import type { Task } from "@/types/database/Task";

// Pending tasks plus those completed since `doneSince` (ISO timestamp).
export async function getTasks(doneSince: string): Promise<Task[] | null> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .or(`done.eq.false,completedAt.gte."${doneSince}"`)
      .order("createdAt", { ascending: true });

    if (error) {
      console.error("Error fetching tasks:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return null;
  }
}
