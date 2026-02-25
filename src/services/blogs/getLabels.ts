import { supabase } from "@/lib/supabase";

export interface BlogLabel {
  id: string;
  name: string;
  color: string;
}

export async function getLabels(userId: string): Promise<BlogLabel[]> {
  const { data, error } = await supabase
    .from("blog_labels")
    .select("id, name, color")
    .eq("userId", userId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching labels:", error);
    return [];
  }
  return data ?? [];
}
