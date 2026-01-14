import { supabase } from "@/lib/supabase";

/**
 * Get all available habits from the habits table
 * @returns Array of all habits
 */
export async function getVisibleHabits(): Promise<
  Array<{ id: string; name: string }>
> {
  try {
    const { data, error } = await supabase
      .from("habits")
      .select("id, name")
      .order("createdAt", { ascending: true });

    if (error) {
      console.error("Error fetching habits:", error.message);
      return [];
    }

    return (
      data?.map((habit) => ({
        ...habit,
        name:
          habit.name.charAt(0).toUpperCase() +
          habit.name.slice(1).toLowerCase(),
      })) || []
    );
  } catch (error) {
    console.error("Error getting habits:", error);
    return [];
  }
}
