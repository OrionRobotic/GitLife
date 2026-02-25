import { supabase } from "@/lib/supabase";

export async function deleteBlog(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("blogs").delete().eq("id", id);

    if (error) {
      console.error("Error deleting blog:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting blog:", error);
    return false;
  }
}
