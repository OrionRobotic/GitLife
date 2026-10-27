import { supabase } from "@/lib/supabase";
import { dateToInteger } from "@/lib/utils/dateToInteger";
import { createHabitLog } from "./createHabitLog";

/**
 * Add a habit log for a specific date
 * @param habitId - The ID of the habit to log
 * @param userId - The ID of the user
 * @param date - The date to log for (defaults to today)
 * @returns True if successful, false if failed
 */
export async function addHabitLogForDate(
  habitId: string,
  userId: string,
  date: Date = new Date()
): Promise<boolean> {
  try {
    // Local calendar day, same key the grid reads (not the UTC createdAt).
    const integerDate = dateToInteger(date);

    const { data: existingLogs, error: checkError } = await supabase
      .from("habitsLogs")
      .select("id")
      .eq("habitId", habitId)
      .eq("userId", userId)
      .eq("integerDate", integerDate);

    if (checkError) {
      console.error("Error checking existing habit log:", checkError);
      return false;
    }

    if (!existingLogs || existingLogs.length === 0) {
      const result = await createHabitLog({ habitId, userId, integerDate });
      return result !== null;
    }

    console.log("Habit log already exists for this date");
    return true;
  } catch (error) {
    console.error("Error adding habit log for date:", error);
    return false;
  }
}
