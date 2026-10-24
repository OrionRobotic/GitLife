import { supabase } from "@/lib/supabase";

export async function deleteTask(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Error deleting task:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting task:", error);
    return false;
  }
}
