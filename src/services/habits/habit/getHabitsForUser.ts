import { supabase } from "@/lib/supabase";

export interface HabitLogWithDetails {
  id: string;
  habitId: string;
  userId: string;
  createdAt: string;
  integerDate: number;
  name: string; // From joined habits table
}

// Type for Supabase join result
interface HabitLogRaw {
  id: string;
  habitId: string;
  userId: string;
  createdAt: string;
  integerDate: number;
  habits: { name: string } | { name: string }[] | null;
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

    const { data, error, status, statusText } = await supabase
      .from("habitsLogs")
      .select(
        `
        id,
        habitId,
        userId,
        createdAt,
        integerDate,
        habits (
          name
        )
      `,
      )
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

    return (
      (data as HabitLogRaw[])?.map((log) => {
        const habits = log.habits;
        const name = Array.isArray(habits)
          ? habits[0]?.name || "Unknown"
          : habits?.name || "Unknown";

        const capitalizedName =
          name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

        return {
          id: log.id,
          habitId: log.habitId,
          userId: log.userId,
          createdAt: log.createdAt,
          integerDate: log.integerDate,
          name: capitalizedName,
        };
      }) || []
    );
  } catch (error) {
    console.error("Unexpected error fetching habits:", {
      error,
      userId,
    });
    return null;
  }
}
