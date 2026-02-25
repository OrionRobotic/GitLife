import { supabase } from "@/lib/supabase";

export async function uploadBlogImage(
  file: File,
  userId: string
): Promise<string | null> {
  try {
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("blog-images")
      .upload(path, file);

    if (error) {
      console.error("Error uploading image:", error);
      return null;
    }

    const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}
