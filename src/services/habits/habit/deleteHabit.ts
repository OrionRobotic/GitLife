import { supabase } from "@/lib/supabase";

/**
 * Delete a habit and all its logs for the given user
 */
export async function deleteHabit(
  habitId: string,
  userId: string
): Promise<boolean> {
  try {
    // Delete all logs for this habit first (avoid FK violation)
    const { error: logsError } = await supabase
      .from("habitsLogs")
      .delete()
      .eq("habitId", habitId)
      .eq("userId", userId);

    if (logsError) {
      console.error("Error deleting habit logs:", logsError);
      return false;
    }

    const { error } = await supabase
      .from("habits")
      .delete()
      .eq("id", habitId);

    if (error) {
      console.error("Error deleting habit:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting habit:", error);
    return false;
  }
}
