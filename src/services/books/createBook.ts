import { supabase } from "@/lib/supabase";
import { Book, BookCreateInput } from "@/types/database";

const BOOK_COLORS = [
  "#C2B59B", "#A89880", "#B5A48A", "#9E8E74", "#BEB09A",
  "#A09078", "#B8A890", "#C5B8A0", "#8E8068", "#B0A088",
  "#ADA08A", "#C0B298", "#978A72", "#BAA990", "#A69882",
];

/**
 * Create a new book in the database
 * @param bookInput - Book creation data
 * @param userId - User ID who owns the book
 * @returns Created book or null if failed
 */
export async function createBook(
  bookInput: BookCreateInput,
  userId: string
): Promise<Book | null> {
  try {
    const color = bookInput.color ?? BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)];
    const height = bookInput.height ?? Math.floor(Math.random() * 40) + 140;

    const { data, error } = await supabase
      .from("books")
      .insert([
        {
          title: bookInput.title,
          author: bookInput.author,
          status: bookInput.status,
          userId: userId,
          color: color,
          height: height,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating book:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error creating book:", error);
    return null;
  }
}
