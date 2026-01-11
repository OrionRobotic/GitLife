import { getHabitsForUser } from "./getHabitsForUser";

/**
 * Get all habits for a user to display on the homepage
 * Retrieves habits directly from the database without filtering
 * @param userId - User ID
 * @returns Array of all user's habits
 */
export async function getVisibleHabits(
  userId: string,
): Promise<Array<{ id: string; name: string }>> {
  try {
    const habits = await getHabitsForUser(userId);

    if (!habits || habits.length === 0) {
      return [];
    }

    // Return all habits without filtering
    return habits.map((habit) => ({
      id: habit.id,
      name: habit.name,
    }));
  } catch (error) {
    console.error("Error getting habits:", error);
    return [];
  }
}
