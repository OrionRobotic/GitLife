import { supabase } from "@/lib/supabase";
import { Blog, BlogCreateInput } from "@/types/database";

export async function createBlog(
  input: BlogCreateInput,
  userId: string
): Promise<Blog | null> {
  try {
    const { data, error } = await supabase
      .from("blogs")
      .insert([
        {
          title: input.title,
          content: input.content,
          userId,
          labelName: input.labelName ?? null,
          labelColor: input.labelColor ?? null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating blog:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error creating blog:", error);
    return null;
  }
}
