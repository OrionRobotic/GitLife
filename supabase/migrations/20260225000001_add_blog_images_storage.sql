-- Create public storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload images into their own folder (userId/filename)
CREATE POLICY "Users can upload blog images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'blog-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can view blog images (they're embedded in blogs)
CREATE POLICY "Blog images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-images');

-- Users can delete their own images
CREATE POLICY "Users can delete own blog images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'blog-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
