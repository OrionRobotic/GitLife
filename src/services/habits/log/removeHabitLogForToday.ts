import { supabase } from "@/lib/supabase";

/**
 * Remove a habit log for today
 * @param habitId - The ID of the habit to remove log for
 * @param userId - The ID of the user
 * @returns True if successful, false if failed
 */
export async function removeHabitLogForToday(
  habitId: string,
  userId: string,
): Promise<boolean> {
  try {
    const today = new Date();
    const dateStart = today.toISOString().split("T")[0];

    const { error } = await supabase
      .from("habitsLogs")
      .delete()
      .eq("habitId", habitId)
      .eq("userId", userId)
      .gte("createdAt", `${dateStart}T00:00:00Z`)
      .lt("createdAt", `${dateStart}T23:59:59Z`);

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
