import { supabase } from "@/lib/supabase";

export async function updateHabitIcon(habitId: string, icon: string): Promise<boolean> {
  const { error } = await supabase
    .from("habits")
    .update({ icon })
    .eq("id", habitId);
  if (error) { console.error("Error updating habit icon:", error); return false; }
  return true;
}
