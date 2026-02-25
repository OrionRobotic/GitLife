import { supabase } from "@/lib/supabase";
import { Book, BookCreateInput } from "@/types/database";

const BORDER_SHADES = [
  "#D5E3DF", "#C3D4D0", "#ABBFB8", "#8EA8A1", "#708F88",
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
    const color = bookInput.color ?? BORDER_SHADES[Math.floor(Math.random() * BORDER_SHADES.length)];
    const height = bookInput.height ?? Math.floor(Math.random() * 14) * 4 + 140;
    const width = bookInput.width ?? Math.floor(Math.random() * 48) + 48;
    const borderWidth = bookInput.borderWidth ?? 1;

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
          width: width,
          borderWidth: borderWidth,
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
