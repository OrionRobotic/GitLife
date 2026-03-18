import { supabase } from "@/lib/supabase";
import type { Goal, GoalCreateInput } from "@/types/database/Goal";

export async function createGoal(
  input: GoalCreateInput,
  userId: string
): Promise<Goal | null> {
  try {
    const { data, error } = await supabase
      .from("goals")
      .insert([
        {
          userId,
          title: input.title,
          type: input.type,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          updatedAt: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating goal:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error creating goal:", error);
    return null;
  }
}
