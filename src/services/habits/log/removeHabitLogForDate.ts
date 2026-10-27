import { supabase } from "@/lib/supabase";
import { dateToInteger } from "@/lib/utils/dateToInteger";

/**
 * Remove a habit log for a specific date
 * @param habitId - The ID of the habit to remove log for
 * @param userId - The ID of the user
 * @param date - The date to remove log for (defaults to today)
 * @returns True if successful, false if failed
 */
export async function removeHabitLogForDate(
  habitId: string,
  userId: string,
  date: Date = new Date()
): Promise<boolean> {
  try {
    // Local calendar day, same key the grid reads (not the UTC createdAt).
    const integerDate = dateToInteger(date);

    const { error } = await supabase
      .from("habitsLogs")
      .delete()
      .eq("habitId", habitId)
      .eq("userId", userId)
      .eq("integerDate", integerDate);

    if (error) {
      console.error("Error removing habit log for date:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error removing habit log for date:", error);
    return false;
  }
}
