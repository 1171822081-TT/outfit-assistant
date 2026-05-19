-- 穿搭助手 Storage Bucket
-- Phase 1.5: 图片存储桶

-- 原图桶 (压缩后电商原图，≤1024px)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'image_original',
  'image_original',
  false,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
);

-- 抠图桶 (去背景透明 PNG，800px)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'image_naked',
  'image_naked',
  false,
  5242880,
  ARRAY['image/png']
);

-- RLS: 用户只能上传/读取自己的图片
-- 文件名约定: {user_id}/{clothing_id}.{ext}
CREATE POLICY "Users upload own images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id IN ('image_original', 'image_naked')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users read own images" ON storage.objects
  FOR SELECT
  USING (
    bucket_id IN ('image_original', 'image_naked')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own images" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id IN ('image_original', 'image_naked')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id IN ('image_original', 'image_naked')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
