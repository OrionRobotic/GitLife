import { supabase } from "@/lib/supabase";
import { Habit } from "@/types/database";

/**
 * Get all habits for a user
 * @param userId - User ID
 * @returns Array of habits or null if failed
 */
export async function getHabitsForUser(
  userId: string,
): Promise<Habit[] | null> {
  try {
    console.log('Fetching habits for user:', userId);
    
    const { data, error, status, statusText } = await supabase
      .from("habits") // This should work if the table exists in public schema
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error('Supabase error fetching habits:', {
        error,
        status,
        statusText,
        userId
      });
      return null;
    }

    console.log('Successfully fetched habits:', data?.length || 0);
    return data;
  } catch (error) {
    console.error('Unexpected error fetching habits:', {
      error,
      userId
    });
    return null;
  }
}
