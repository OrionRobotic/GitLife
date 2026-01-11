import { supabase } from "@/lib/supabase";

/**
 * Get all available habits from the habits table
 * @param userId - User ID (kept for API compatibility)
 * @returns Array of all habits
 */
export async function getVisibleHabits(
  userId: string,
): Promise<Array<{ id: string; name: string }>> {
  try {
    const { data, error } = await supabase
      .from("habits")
      .select("id, name")
      .order("createdAt", { ascending: true });

    if (error) {
      console.error("Error fetching habits:", error.message);
      return [];
    }

    console.log("Visible habits:", data);
    return data || [];
  } catch (error) {
    console.error("Error getting habits:", error);
    return [];
  }
}
