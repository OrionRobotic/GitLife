import { supabase } from "@/lib/supabase";

export interface HabitLogWithDetails {
  id: string;
  habitId: string;
  userId: string;
  createdAt: string;
  integerDate: number;
  name: string; // From joined habits table
}

/**
 * Get all habit logs for a user with habit details (name)
 * @param userId - User ID
 * @returns Array of habit logs with details or null if failed
 */
export async function getHabitsForUser(
  userId: string,
): Promise<HabitLogWithDetails[] | null> {
  try {
    console.log("Fetching habits for user:", userId);

    // Join habitsLogs with habits table to get the habit name
    const { data, error, status, statusText } = await supabase
      .from("habitsLogs")
      .select(`
        id,
        habitId,
        userId,
        createdAt,
        integerDate,
        habits (
          name
        )
      `)
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Supabase error fetching habits:", {
        error,
        status,
        statusText,
        userId,
      });
      return null;
    }

    // Supabase returns: { habits: { name: "reading" } }
    // We flatten it to: { name: "reading" } for easier access
    return data?.map((log: any) => ({
      id: log.id,
      habitId: log.habitId,
      userId: log.userId,
      createdAt: log.createdAt,
      integerDate: log.integerDate,
      name: log.habits?.name || "Unknown",
    })) || [];
  } catch (error) {
    console.error("Unexpected error fetching habits:", {
      error,
      userId,
    });
    return null;
  }
}
