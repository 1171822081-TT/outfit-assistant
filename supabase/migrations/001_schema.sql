-- 穿搭助手 数据库 Schema
-- Phase 1.3: 7 张核心表

-- 0. 扩展: uuid 生成支持
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. clothing: 衣物表
CREATE TABLE clothing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory')),
  subcategory TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  color_hex TEXT NOT NULL DEFAULT '#999999',
  style TEXT NOT NULL CHECK (style IN ('casual', 'office', 'sport', 'sweet', 'cool', 'gentle')),
  thickness TEXT NOT NULL CHECK (thickness IN ('thin', 'medium', 'thick', 'down')),
  waterproof BOOLEAN NOT NULL DEFAULT false,
  material TEXT NOT NULL DEFAULT 'cotton',
  temp_min INTEGER NOT NULL DEFAULT 0,
  temp_max INTEGER NOT NULL DEFAULT 40,
  image_original TEXT,
  image_naked TEXT,
  anchor_x REAL NOT NULL DEFAULT 0.5,
  anchor_y REAL NOT NULL DEFAULT 0.5,
  scale_x REAL NOT NULL DEFAULT 1.0,
  scale_y REAL NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'stored', 'idle')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. outfit: 搭配表
CREATE TABLE outfit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  is_recommended BOOLEAN NOT NULL DEFAULT false,
  weather_condition JSONB,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  style TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. outfit_item: 搭配-衣物关联表
CREATE TABLE outfit_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id UUID NOT NULL REFERENCES outfit(id) ON DELETE CASCADE,
  clothing_id UUID NOT NULL REFERENCES clothing(id) ON DELETE CASCADE,
  slot TEXT NOT NULL CHECK (slot IN ('top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory')),
  layer_order INTEGER NOT NULL DEFAULT 0
);

-- 4. diary: 穿搭日记表
CREATE TABLE diary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  outfit_id UUID REFERENCES outfit(id) ON DELETE SET NULL,
  weather_info JSONB,
  rating INTEGER NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  note TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- 5. user_profile: 用户偏好表
CREATE TABLE user_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  style_prefs TEXT[] NOT NULL DEFAULT '{}',
  personality TEXT NOT NULL DEFAULT 'confident' CHECK (personality IN ('outgoing', 'introverted', 'confident', 'gentle')),
  commute TEXT NOT NULL DEFAULT 'walk' CHECK (commute IN ('walk', 'bike', 'subway', 'drive', 'home')),
  onboarding_done BOOLEAN NOT NULL DEFAULT false,
  fav_style_counts JSONB NOT NULL DEFAULT '{}',
  fav_category_counts JSONB NOT NULL DEFAULT '{}',
  fav_color_counts JSONB NOT NULL DEFAULT '{}',
  fav_clothing_ids TEXT[] NOT NULL DEFAULT '{}',
  fav_patterns JSONB NOT NULL DEFAULT '[]'
);

-- 6. compliments: 夸赞语料库
CREATE TABLE compliments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  personality_tags TEXT[] NOT NULL DEFAULT '{}',
  is_fallback BOOLEAN NOT NULL DEFAULT false
);

-- 7. image_queue: 图片处理队列表
CREATE TABLE image_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clothing_id UUID NOT NULL REFERENCES clothing(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'retrying', 'done', 'failed', 'skipped')),
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_heartbeat TIMESTAMPTZ
);
