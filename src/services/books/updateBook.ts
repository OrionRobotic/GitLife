import { supabase } from "@/lib/supabase";
import { Book, BookUpdateInput } from "@/types/database";

/**
 * Update a book in the database
 * @param bookInput - Book update data with id
 * @returns Updated book or null if failed
 */
export async function updateBook(
  bookInput: BookUpdateInput
): Promise<Book | null> {
  try {
    const { id, ...updates } = bookInput;

    const { data, error } = await supabase
      .from("books")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating book:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error updating book:", error);
    return null;
  }
}
