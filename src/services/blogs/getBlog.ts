import { supabase } from "@/lib/supabase";
import { Blog } from "@/types/database";

export async function getBlog(id: string): Promise<Blog | null> {
  try {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching blog:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching blog:", error);
    return null;
  }
}
