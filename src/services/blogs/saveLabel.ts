import { supabase } from "@/lib/supabase";

export async function saveLabel(
  name: string,
  color: string,
  userId: string
): Promise<void> {
  await supabase
    .from("blog_labels")
    .upsert([{ name, color, userId }], { onConflict: "userId,name" });
}
