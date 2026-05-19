-- 穿搭助手 数据库索引
-- Phase 1.4: 性能索引

-- 衣物查询: 按用户+分类
CREATE INDEX idx_clothing_user_category ON clothing(user_id, category);

-- 衣物查询: 按用户+风格
CREATE INDEX idx_clothing_user_style ON clothing(user_id, style);

-- 衣物查询: 温度范围筛选 (推荐引擎核心)
CREATE INDEX idx_clothing_temp_range ON clothing(temp_min, temp_max);

-- 搭配查询: 按用户+推荐状态 (首页加载)
CREATE INDEX idx_outfit_user_recommended ON outfit(user_id, is_recommended, created_at DESC);

-- 搭配查询: 按用户+收藏 (我的搭配页)
CREATE INDEX idx_outfit_user_favorite ON outfit(user_id, is_favorite, created_at DESC);

-- 搭配-衣物关联: 按搭配ID查询衣物列表
CREATE INDEX idx_outfit_item_outfit ON outfit_item(outfit_id);

-- 日记查询: 按用户+日期
CREATE INDEX idx_diary_user_date ON diary(user_id, date DESC);

-- 图片队列: 按用户+状态 (超时恢复)
CREATE INDEX idx_image_queue_user_status ON image_queue(user_id, status);
