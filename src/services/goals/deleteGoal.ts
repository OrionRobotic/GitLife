import { supabase } from "@/lib/supabase";

export async function deleteGoal(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("goals").delete().eq("id", id);

    if (error) {
      console.error("Error deleting goal:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting goal:", error);
    return false;
  }
}
