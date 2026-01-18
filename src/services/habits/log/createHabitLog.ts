import { supabase } from "@/lib/supabase";
import { HabitLog, HabitLogCreateInput } from "@/types/database";
import { dateToInteger } from "@/lib/utils/dateToInteger";

/**
 * Create a habit log entry
 * @param habitLogInput - Habit log creation data
 * @returns Created habit log or null if failed
 */
export async function createHabitLog(
  habitLogInput: HabitLogCreateInput,
): Promise<HabitLog | null> {
  try {
    const integerDate = habitLogInput.integerDate || dateToInteger(new Date());

    const { data, error } = await supabase
      .from("habitsLogs")
      .insert([
        {
          habitId: habitLogInput.habitId,
          userId: habitLogInput.userId,
          integerDate: integerDate,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating habit log:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error creating habit log:", error);
    return null;
  }
}
