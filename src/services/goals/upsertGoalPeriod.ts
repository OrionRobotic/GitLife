import { supabase } from "@/lib/supabase";
import type { GoalPeriod, GoalPeriodUpsertInput } from "@/types/database/Goal";

export async function upsertGoalPeriod(
  input: GoalPeriodUpsertInput,
  userId: string
): Promise<GoalPeriod | null> {
  try {
    const { data, error } = await supabase
      .from("goal_periods")
      .upsert(
        {
          userId,
          type: input.type,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          title: input.title,
          updatedAt: new Date().toISOString(),
        },
        { onConflict: "userId,type,periodStart,periodEnd" }
      )
      .select()
      .single();

    if (error) {
      console.error("Error upserting goal period:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error upserting goal period:", error);
    return null;
  }
}
