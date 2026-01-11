import { supabase } from "@/lib/supabase";
import { createHabitLog } from "./createHabitLog";

/**
 * Add a habit log for today
 * @param habitId - The ID of the habit to log
 * @param userId - The ID of the user
 * @returns True if successful, false if failed
 */
export async function addHabitLogForToday(
  habitId: string,
  userId: string,
): Promise<boolean> {
  try {
    const today = new Date();
    const dateStart = today.toISOString().split("T")[0];

    const { data: existingLogs, error: checkError } = await supabase
      .from("habitsLogs")
      .select("id")
      .eq("habitId", habitId)
      .eq("userId", userId)
      .gte("createdAt", `${dateStart}T00:00:00Z`)
      .lt("createdAt", `${dateStart}T23:59:59Z`);

    if (checkError) {
      console.error("Error checking existing habit log:", checkError);
      return false;
    }

    if (!existingLogs || existingLogs.length === 0) {
      const result = await createHabitLog({ habitId, userId });
      return result !== null;
    }

    console.log("Habit log already exists for today");
    return true;
  } catch (error) {
    console.error("Error adding habit log for today:", error);
    return false;
  }
}
