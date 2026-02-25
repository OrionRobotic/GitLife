import { supabase } from "@/lib/supabase";
import { Book } from "@/types/database";

/**
 * Fetch all books for a user
 * @param userId - User ID
 * @returns Array of books or null if failed
 */
export async function getBooks(userId: string): Promise<Book[] | null> {
  try {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error fetching books:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching books:", error);
    return null;
  }
}
