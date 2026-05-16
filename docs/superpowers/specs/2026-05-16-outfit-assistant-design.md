# 穿搭助手 — 技术设计文档

**日期**: 2026-05-16
**版本**: v1.0
**状态**: 待审核

---

## 一、项目概述

### 1.1 目标
为女朋友提供一个天气驱动的每日穿搭推荐工具。基于明日天气、个人偏好、历史收藏，智能推荐 3 套搭配，在 2D 模特上展示效果。同时提供情绪价值（搭配联动夸赞）。

### 1.2 用户与场景
- 主要用户：女朋友，手机浏览器打开使用
- 次要用户：你，负责录入衣物和管理系统
- 用户模式：多用户，第一期即支持注册/登录，每人独立衣柜和偏好

### 1.3 核心约束
- 开发者零基础，全程 AI 辅助
- MVP 用 2D 纸娃娃，3D 远期再上
- 手机优先，响应式布局
- 零服务器成本（全部用免费 BaaS）

---

## 二、技术架构

### 2.1 整体架构

```
React SPA (Vite + TypeScript + Tailwind CSS)
    │
    ├──→ Supabase
    │       ├── Auth（手机号+密码 / 短信验证码 / 微信 OAuth）
    │       ├── PostgreSQL（Row Level Security 按 user_id 隔离）
    │       ├── Storage（衣物原图、去背景透明 PNG）
    │       └── REST API（自动生成）
    │
    ├──→ 和风天气 API（前端直调，免费 1000次/天）
    │
    └──→ @imgly/background-removal（浏览器端 AI 抠图）
```

部署：Vercel（关联 GitHub，push 自动部署）

### 2.2 技术选型

| 层 | 选型 | 理由 |
|----|------|------|
| 前端框架 | React 18 + Vite + TypeScript | AI 生成代码质量最高 |
| 样式 | Tailwind CSS | 响应式简单，移动端友好 |
| 路由 | React Router v6 | 3 个 Tab，够用 |
| 认证 | Supabase Auth | 手机号+密码、手机号+验证码、微信登录 |
| 数据库 | Supabase (PostgreSQL) | 自带 REST API + RLS 行级安全 |
| 2D 模特 | HTML5 Canvas | 图层叠加，代码量小 |
| 图片处理 | @imgly/background-removal | 浏览器端抠图，无服务器 |
| 天气 | 和风天气 API | 免费 1000次/天 |
| 部署 | Vercel | 免费，自动部署 |

### 2.3 认证方式说明

Supabase Auth 原生支持三种登录方式，均为免费额度内：

| 方式 | 实现 | 备注 |
|------|------|------|
| 微信登录 | Supabase OAuth + 微信开放平台 | 需注册微信开放平台账号，配置 AppID/AppSecret |
| 手机号+密码 | Supabase Phone Auth + password | 开箱即用 |
| 手机号+验证码 | Supabase Phone Auth (SMS OTP) | 每月免费 50 条短信，超出需付费 |

### 2.4 与原需求文档的差异
- **取消** Node.js/Python 后端，全部用 Supabase BaaS
- **取消** MVP 阶段 Three.js，改用 Canvas 2D
- **取消** Ant Design，改用 Tailwind CSS
- **新增** @imgly/background-removal 电商图自动去背景
- **新增** PraiseBanner 夸赞横幅
- **新增** Onboarding 首次问卷
- **新增** 收藏反馈闭环

---

## 三、数据模型

### 3.1 clothing（衣物）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | PK | |
| name | TEXT | "白色短袖T恤" |
| category | TEXT | top / bottom / dress / outerwear / shoes / accessory |
| subcategory | TEXT | tshirt / shirt / hoodie / jeans / skirt / ... |
| color | TEXT | 白色 |
| color_hex | TEXT | #FFFFFF |
| style | TEXT | casual / office / sport / sweet / cool / gentle |
| thickness | TEXT | thin / medium / thick / down |
| temp_min | INTEGER | 适合最低温度 |
| temp_max | INTEGER | 适合最高温度 |
| image_original | TEXT | Supabase Storage URL（电商原图） |
| image_naked | TEXT | Supabase Storage URL（去背景透明 PNG） |
| status | TEXT | active / stored / idle |
| user_id | FK → auth.users | 所属用户，RLS 隔离依据 |

### 3.2 outfit（搭配）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | PK | |
| name | TEXT | "通勤优雅" |
| is_recommended | BOOLEAN | 系统推荐 / 用户自搭 |
| weather_condition | JSONB | 推荐时的天气条件 |
| is_favorite | BOOLEAN | 是否收藏 |
| style | TEXT | 搭配整体风格标签 |
| user_id | FK → auth.users | 所属用户 |

### 3.3 outfit_item（搭配明细 — 多对多）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | PK | |
| outfit_id | FK → outfit | |
| clothing_id | FK → clothing | |
| slot | TEXT | top / bottom / dress / outerwear / shoes / accessory |
| layer_order | INTEGER | 同部位叠穿顺序（1, 2, 3...） |

**设计理由**：原文档用固定字段（top_id, bottom_id, ...）无法叠穿、加配饰需改表。改用多对多，一条搭配可包含任意数量和种类的衣物。

### 3.4 diary（穿搭日记）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | PK | |
| date | DATE | 哪天穿了 |
| outfit_id | FK → outfit（可空） | |
| weather_info | JSONB | 当天天气 |
| rating | INTEGER | 1-5 |
| note | TEXT | |
| user_id | FK → auth.users | 所属用户 |

### 3.5 user_profile（用户画像）

| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | PK (FK → auth.users) | 与 Supabase Auth 用户一一对应 |
| style_prefs | TEXT[] | {"office", "gentle"} |
| personality | TEXT | outgoing / introverted / confident / gentle |
| commute | TEXT | walk / bike / subway / drive / home |
| onboarding_done | BOOLEAN | |
| fav_style_counts | JSONB | {"sweet": 8, "office": 2} |
| fav_category_counts | JSONB | {"dress": 10, "top": 15} |
| fav_color_counts | JSONB | {"white": 12, "pink": 7} |
| fav_clothing_ids | INT[] | 高频被收藏的衣物 ID |
| fav_patterns | JSONB | [{"slots":["shirt","skirt","flats"],"count":5}] |

### 3.6 compliments（夸赞库）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | PK | |
| text | TEXT | 30 字以内 |
| tags | TEXT[] | {"露肩", "裙子", "通勤", ...} |
| personality_tags | TEXT[] | {"outgoing", "gentle", ...} |
| is_fallback | BOOLEAN | 通用兜底夸赞 |

### 3.7 image_queue（图片处理队列）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | PK | |
| clothing_id | FK → clothing | |
| original_url | TEXT | |
| status | TEXT | pending / processing / done / failed |
| error_message | TEXT | |

### 3.8 数据隔离（Row Level Security）

所有含 user_id 的表（clothing, outfit, diary, user_profile, image_queue）启用 Supabase RLS 策略：

```sql
-- 用户只能读写自己的数据
ALTER TABLE clothing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_isolation" ON clothing
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

compliments 表为公共读（所有用户共享夸赞库），无需 user_id。

---

## 四、页面与组件结构

### 4.1 页面结构

4 个页面（含认证）：

```
登录/注册页（Supabase Auth）
  ├── 微信登录（OAuth，一键跳转授权）
  ├── 手机号 + 密码登录/注册
  └── 手机号 + 短信验证码登录/注册

登录后 → 首次使用先弹出 Onboarding 问卷 → 完成后进入主界面：

Tab 1: 首页（推荐）
  ├── WeatherCard         天气信息条
  ├── PraiseBanner         搭配联动夸赞（新增）
  ├── ModelViewer          Canvas 2D 模特展示
  ├── OutfitSwitcher       左右切换 3 套搭配
  └── OutfitActions        收藏/换一批/自由搭配

Tab 2: 衣柜
  ├── CategoryTabs         分类筛选栏
  ├── FilterBar            颜色/风格筛选
  ├── ClothingGrid         2 列卡片网格
  └── ClothingForm         录入/编辑 Bottom Sheet

Tab 3: 我的搭配
  ├── OutfitList           收藏 + 自搭列表
  ├── OutfitCalendar       穿搭日历
  └── OutfitEditor         自由搭配模式

共享组件：
  ├── ImageUploader        上传 + 触发抠图
  ├── LoadingState         骨架屏
  └── EmptyState           空状态引导
```

### 4.2 移动端布局策略

- 宽度基准：max-width 480px，超出居中
- 底部导航：固定底部，高度 56px，图标+文字
- 衣柜：2 列卡片网格
- 模特区域：占屏幕中间 60% 高度，Canvas 自适应
- 表单：全屏 Bottom Sheet，底部固定提交按钮

---

## 五、Onboarding（首次使用问卷）

首次打开弹出以下 3 个问题，答案影响推荐和夸赞：

1. **穿衣风格偏好**（多选，最多 2 个）
   - 休闲自在 / 通勤干练 / 运动活力 / 甜美可爱 / 酷飒帅气 / 温柔气质
   - 影响：推荐时该风格搭配权重 +30%

2. **性格类型**（单选）
   - 开朗外向 / 安静内敛 / 自信独立 / 温柔细腻
   - 影响：夸赞语气适配

3. **通勤方式**（单选）
   - 走路 / 骑车 / 公交地铁 / 开车 / 居家不出门
   - 影响：推荐时增加实用约束

通勤约束规则：
| 通勤 | 排除 | 优先 |
|------|------|------|
| 骑车 | 短裙、凉鞋、高跟鞋、长外套 | 裤装、运动鞋、短外套 |
| 走路 | 高跟鞋、厚底鞋 | 平底鞋、运动鞋 |
| 公交地铁 | — | 薄外套（温差） |
| 开车 | — | — |
| 居家 | — | 舒适面料 |

---

## 六、推荐引擎

### 6.1 推荐流程

1. 获取明日天气（温度、天气类型、风力、降水概率）
2. 从衣柜筛选温度匹配的衣物（temp_min ≤ 最高温 AND temp_max ≥ 最低温）
3. 下雨 → 排除凉鞋/布面鞋，过滤无防水外套
4. 按风格分组，生成候选搭配组合
5. 颜色冲突检测（主色 ≤ 3 个）、风格一致性、厚薄一致
6. 评分排序，取 Top 3，确保风格差异化
7. 返回结果

### 6.2 评分公式

```
搭配得分 = 天气匹配 × 0.4
         + 风格偏好 × 0.25
         + 通勤适配 × 0.15
         + 收藏偏好 × 0.2
```

- 天气匹配：温度命中、降水应对
- 风格偏好：与用户画像的偏好风格重合度
- 通勤适配：是否满足通勤方式约束
- 收藏偏好：与历史收藏的风格/品类/颜色匹配度（冷启动时为 0）

### 6.3 降级策略

| 异常 | 降级 |
|------|------|
| 天气 API 失败 | 展示缓存天气 + "天气可能不是最新" |
| 温度匹配无结果 | 放宽 ±3°C；仍无则提示"暂无合适衣物" |
| 衣柜 < 5 件 | 能做几套做几套，引导加衣物 |
| 风格不足 3 种 | 放宽风格约束，允许同风格不同单品 |

---

## 七、夸赞系统（PraiseBanner）

### 7.1 展示逻辑

- 位于首页天气卡下方、模特上方
- 内容与当前展示的搭配联动（不是随机夸）
- 切换搭配时夸赞联动更新

### 7.2 匹配规则

搭配汇总特征标签（如吊带+裙子 → {"露肩", "裙子", "甜美"}），从夸赞库筛选命中标签的夸赞 → 按性格标签过滤 → 排除近期已展示 → 随机选一条。

### 7.3 多样化

- 每个标签至少 8-10 条夸赞
- localStorage 记录最近 10 条已展示，选择时排除
- 确保同标签不同夸赞，不同时间看到不同内容

### 7.4 文案原则

夸细节、夸选择、夸气质，不夸空话。30 字以内。需与搭配实际特征匹配（露肩才夸锁骨，裙子才夸腰线，运动才夸活力）。

---

## 八、图片自动处理

流程：
1. 用户粘贴电商图 URL 或上传文件 → 保存至 Supabase Storage
2. @imgly/background-removal 在 Web Worker 中运行去背景
3. 成功 → 透明 PNG 存为 clothing.image_naked
4. 失败 → image_queue 标记 failed，提示用户换图或手动上传

---

## 九、收藏反馈闭环

用户收藏搭配 → 系统提取风格、品类、颜色、单品、搭配结构 5 个维度的偏好 → 更新 user_profile 偏好字段 → 下次推荐加权匹配。

冷启动时收藏偏好权重为 0，随收藏增多权重逐渐生效，推荐越来越准。

---

## 十、错误处理

### 10.1 网络异常
- 天气 API 失败 → 缓存天气 + 黄色标签
- Supabase 失败 → localStorage 缓存 + 红色提示条
- 图片上传失败 → 保留表单内容 + 重试按钮
- 全部 API 不可用 → 离线模式快照

### 10.2 空状态
- 首页无推荐 → 引导加衣物
- 衣柜空 → 插图 + "添加第一件衣物"
- 无收藏 → "去首页看看推荐"
- 无日记 → "今天还没记录"

### 10.3 加载状态
- 首页首次加载 → 骨架屏
- 推荐生成中 → 脉冲动画 "正在搭配..."
- 图片抠图中 → 进度条
- 衣柜列表 → 6 个灰色卡片骨架

### 10.4 边界情况
- 衣柜 < 2 件 → 不硬凑 3 套
- 全部同风格 → 放宽差异化约束
- 极端天气无匹配 → 放宽温度 ±5°C
- 问卷未完成退出 → 下次打开继续 / 可跳过
- 抠图失败 → 标记待处理，可重新处理或手动上传
- 同一天反复打开 → 当天日期 key 缓存

---

## 十一、二期规划（本次不实现）

- 3D 模特（Three.js 贴图方案）
- PWA 离线能力
- 夸赞互动效果
- 微信小程序版本
- 定时推送提醒
- AI 生成夸赞文案
- 多用户系统
- 穿搭社区/分享

---

## 十二、预算

| 项目 | 费用 |
|------|------|
| 域名（可选） | ~50 元/年 |
| 服务器 | 免费（Vercel + Supabase 免费额度） |
| 天气 API | 免费（和风天气 1000次/天） |
| **总计** | **几乎零成本** |

---

> **下一步**：审核通过后，进入实施计划（writing-plans）。
