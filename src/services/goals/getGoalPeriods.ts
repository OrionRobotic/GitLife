import { supabase } from "@/lib/supabase";
import type { GoalPeriod } from "@/types/database/Goal";

export async function getGoalPeriods(): Promise<GoalPeriod[] | null> {
  try {
    const { data, error } = await supabase
      .from("goal_periods")
      .select("*")
      .order("periodStart", { ascending: true });

    if (error) {
      console.error("Error fetching goal periods:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching goal periods:", error);
    return null;
  }
}
