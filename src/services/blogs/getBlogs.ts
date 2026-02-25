import { supabase } from "@/lib/supabase";
import { Blog } from "@/types/database";

export async function getBlogs(userId: string): Promise<Blog[] | null> {
  try {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error fetching blogs:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return null;
  }
}
