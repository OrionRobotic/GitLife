import { supabase } from "@/lib/supabase";
import { Blog, BlogUpdateInput } from "@/types/database";

export async function updateBlog(input: BlogUpdateInput): Promise<Blog | null> {
  try {
    const { id, ...updates } = input;
    const { data, error } = await supabase
      .from("blogs")
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating blog:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error updating blog:", error);
    return null;
  }
}
