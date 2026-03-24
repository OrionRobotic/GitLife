import { supabase } from "@/lib/supabase";
import type { Goal, GoalUpdateInput } from "@/types/database/Goal";

export async function updateGoal(
  id: string,
  input: GoalUpdateInput
): Promise<Goal | null> {
  try {
    const { data, error } = await supabase
      .from("goals")
      .update({ ...input, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating goal:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error updating goal:", error);
    return null;
  }
}
