import { supabase } from "@/lib/supabase";
import { Habit, HabitCreateInput } from "@/types/database";

/**
 * Create a new habit in the database
 * @param habitInput - Habit creation data
 * @param userId - User ID who owns the habit
 * @returns Created habit or null if failed
 */
export async function createHabit(
  habitInput: HabitCreateInput,
  userId: string
): Promise<Habit | null> {
  try {
    const { data, error } = await supabase
      .from("habits")
      .insert([
        {
          name: habitInput.name,
          userId: userId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating habit:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error creating habit:", error);
    return null;
  }
}
