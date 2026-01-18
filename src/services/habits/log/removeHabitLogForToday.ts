import { supabase } from "@/lib/supabase";
import { dateToInteger } from "@/lib/utils/dateToInteger";

/**
 * Remove a habit log for today
 * @param habitId - The ID of the habit to remove log for
 * @param userId - The ID of the user
 * @returns True if successful, false if failed
 */
export async function removeHabitLogForToday(
  habitId: string,
  userId: string
): Promise<boolean> {
  try {
    const today = new Date();
    const integerDate = dateToInteger(today);

    const { error } = await supabase
      .from("habitsLogs")
      .delete()
      .eq("habitId", habitId)
      .eq("userId", userId)
      .eq("integerDate", integerDate);

    if (error) {
      console.error("Error removing habit log for today:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error removing habit log for today:", error);
    return false;
  }
}
