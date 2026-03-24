import { supabase } from "@/lib/supabase";
import type { Goal } from "@/types/database/Goal";

export async function getGoals(): Promise<Goal[] | null> {
  try {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("periodStart", { ascending: true })
      .order("sortOrder", { ascending: true });

    if (error) {
      console.error("Error fetching goals:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching goals:", error);
    return null;
  }
}
