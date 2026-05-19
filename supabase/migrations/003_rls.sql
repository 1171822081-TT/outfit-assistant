-- 穿搭助手 RLS 策略
-- Phase 1.6: 行级安全

-- 所有含 user_id 的表启用 RLS
ALTER TABLE clothing ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_queue ENABLE ROW LEVEL SECURITY;

-- compliments 表公开读 (夸赞语料库所有人可读)
-- 不启用 RLS，或启用后允许公开 SELECT

-- clothing: 用户只能读写自己的衣物
CREATE POLICY "Users manage own clothing" ON clothing
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- outfit: 用户只能读写自己的搭配
CREATE POLICY "Users manage own outfits" ON outfit
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- outfit_item: 通过 outfit 间接控制 (子查询验证所有权)
CREATE POLICY "Users manage own outfit items" ON outfit_item
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM outfit
      WHERE outfit.id = outfit_item.outfit_id
      AND outfit.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM outfit
      WHERE outfit.id = outfit_item.outfit_id
      AND outfit.user_id = auth.uid()
    )
  );

-- diary: 用户只能读写自己的日记
CREATE POLICY "Users manage own diaries" ON diary
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_profile: 用户只能读写自己的档案
CREATE POLICY "Users manage own profile" ON user_profile
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- image_queue: 用户只能读写自己的队列记录
CREATE POLICY "Users manage own image queue" ON image_queue
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
