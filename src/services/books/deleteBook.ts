import { supabase } from "@/lib/supabase";

/**
 * Delete a book from the database
 * @param bookId - ID of the book to delete
 * @returns true if successful, false if failed
 */
export async function deleteBook(bookId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("books")
      .delete()
      .eq("id", bookId);

    if (error) {
      console.error("Error deleting book:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting book:", error);
    return false;
  }
}
