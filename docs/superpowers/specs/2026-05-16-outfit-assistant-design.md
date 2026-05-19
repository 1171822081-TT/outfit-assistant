# 穿搭助手 — 技术设计文档

**日期**: 2026-05-16
**版本**: v1.1
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
React SPA (Vite + TypeScript + Tailwind CSS + Zustand)
    │
    ├──→ Supabase
    │       ├── Auth（邮箱+验证码注册 / 手机号或邮箱+密码登录 / 邮箱找回密码）
    │       ├── PostgreSQL（Row Level Security 按 user_id 隔离）
    │       ├── Storage（衣物原图、去背景透明 PNG）
    │       ├── Edge Functions（天气 API 代理，保护 API Key 不暴露到前端）
    │       └── REST API（自动生成）
    │
    ├──→ Supabase Edge Function → 和风天气 API
    │       天气请求经 Edge Function 中转，前端不持有 Key
    │
    └──→ @imgly/background-removal（浏览器端 AI 抠图，Web Worker 中运行）
```

部署：Vercel（关联 GitHub，push 自动部署）

### 2.2 技术选型

| 层 | 选型 | 理由 |
|----|------|------|
| 前端框架 | React 18 + Vite + TypeScript | AI 生成代码质量最高 |
| 样式 | Tailwind CSS | 响应式简单，移动端友好 |
| 状态管理 | Zustand | 轻量（~1KB），TypeScript 友好，无 boilerplate |
| 路由 | React Router v6 | 3 个 Tab，够用 |
| 认证 | Supabase Auth | 邮箱注册+验证码、手机号或邮箱+密码登录、邮箱找回密码 |
| 数据库 | Supabase (PostgreSQL) | 自带 REST API + RLS 行级安全 |
| 天气 | Supabase Edge Function → 和风天气 API | Key 保护在后端，免费 1000次/天 |
| 2D 模特 | HTML5 Canvas | 图层叠加，代码量小 |
| 图片处理 | @imgly/background-removal | 浏览器端抠图，Web Worker，无服务器 |
| 部署 | Vercel | 免费，自动部署 |

### 2.3 认证方式说明

认证流程基于邮箱，已放弃短信验证码服务：

| 场景 | 实现 | 说明 |
|------|------|------|
| 注册 | 邮箱 + 密码 | 仅支持邮箱注册，Supabase 自动发送验证邮件确认邮箱有效性 |
| 登录 | 手机号或邮箱 + 密码 | 手机号登录通过 `user_profile.phone` → `auth.users.email` 查找实现 |
| 验证码登录 | 邮箱 + OTP | Supabase `signInWithOtp`，验证码发送至邮箱 |
| 找回密码 | 邮箱 + OTP → 重置密码 | 通过邮箱发送验证码，验证后设置新密码 |

**注册→登录流程**：用户注册成功后自动跳转至登录页面，使用注册邮箱和密码完成首次登录。

**手机号登录原理**：用户注册时填写邮箱，注册后在 Onboarding 或设置中绑定手机号（存储于 `user_profile.phone`）。登录时系统通过 `lookup_email_by_phone` 函数将手机号映射到邮箱，再调用 Supabase Auth 完成密码验证。

> **设计决策**：放弃短信验证码服务是因为邮箱绑定手机号，邮箱验证码可覆盖全部验证场景（注册验证、登录验证、密码找回），无需额外维护 SMS 渠道。

### 2.4 与原需求文档的差异
- **取消** Node.js/Python 后端，全部用 Supabase BaaS
- **取消** MVP 阶段 Three.js，改用 Canvas 2D 分层叠加（见 [七、Canvas 2D 模特渲染方案](#七canvas-2d-模特渲染方案)）
- **取消** Ant Design，改用 Tailwind CSS
- **新增** Zustand 轻量状态管理
- **新增** Supabase Edge Function 作为天气 API 代理（保护 Key 不暴露到前端）
- **新增** @imgly/background-removal 电商图自动去背景（含上传前 Canvas 预压缩，保证移动端性能）
- **新增** PraiseBanner 夸赞横幅
- **新增** Onboarding 首次问卷
- **新增** 收藏反馈闭环
- **新增** 数据库索引策略预防性设计

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
| waterproof | BOOLEAN | 是否防水（外套/鞋子类专用，默认 FALSE） |
| material | TEXT | 面料：cotton / denim / leather / rubber / wool / down / silk / polyester / canvas |
| temp_min | INTEGER | 适合最低温度 |
| temp_max | INTEGER | 适合最高温度 |
| image_original | TEXT | Supabase Storage URL（电商原图，压缩后宽 ≤ 1024px） |
| image_naked | TEXT | Supabase Storage URL（去背景透明 PNG，宽 800px） |
| anchor_x | FLOAT | 衣物锚点 X（0-1 比例），默认按 slot 预设 |
| anchor_y | FLOAT | 衣物锚点 Y（0-1 比例），默认按 slot 预设 |
| scale_x | FLOAT | 水平缩放系数，默认 1.0 |
| scale_y | FLOAT | 垂直缩放系数，默认 1.0 |
| status | TEXT | active / stored / idle |
| user_id | FK → auth.users | 所属用户，RLS 隔离依据 |

### 3.2 outfit（搭配）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | PK | |
| name | TEXT | "通勤优雅" |
| is_recommended | BOOLEAN | 系统推荐 / 用户自搭 |
| weather_condition | JSONB | 推荐时的天气条件，结构见下方示例 |
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

**weather_condition JSONB 结构示例**：
```json
{
  "temp_high": 28,
  "temp_low": 18,
  "weather_type": "多云",
  "wind_level": 2,
  "precip_probability": 0.1,
  "humidity": 65
}
```

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
| text | TEXT | 建议 50 字以内 |
| tags | TEXT[] | {"露肩", "裙子", "通勤", ...} |
| personality_tags | TEXT[] | {"outgoing", "gentle", ...} |
| is_fallback | BOOLEAN | 通用兜底夸赞 |

### 3.7 image_queue（图片处理队列）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | PK | |
| clothing_id | FK → clothing | |
| user_id | FK → auth.users | 冗余字段，与 clothing.user_id 一致，便于 RLS |
| original_url | TEXT | |
| status | TEXT | pending / processing / retrying / done / failed / skipped |
| error_message | TEXT | |
| retry_count | INTEGER | 重试次数，默认 0，最大 3 |
| last_heartbeat | TIMESTAMPTZ | 前端心跳时间，用于超时检测 |

> **超时检测**：前端在 Web Worker 中定期更新 `last_heartbeat`（每 5 秒）。下次打开页面时检测 `status = 'processing' AND last_heartbeat < NOW() - INTERVAL '10 minutes'` 的记录 → 自动重置为 `pending`。`retry_count ≥ 3` 的记录标记为 `failed`，停止自动重试。

> **user_id 冗余说明**：虽然可通过 clothing JOIN 获取 user_id，但 Supabase RLS 对跨表查询支持有限。冗余 user_id 后可直接用 `auth.uid() = user_id` 策略，写入时在应用层保证与 clothing.user_id 一致。

> **安全约束**：image_queue 写入推荐通过 Supabase Edge Function（而非前端直接 INSERT），由后端校验 `clothing.user_id = auth.uid()` 后再写入，防止 user_id 被篡改。MVP 阶段如使用前端直写，需在前端代码中显式校验归属。

### 3.8 数据隔离（Row Level Security）

所有含 user_id 的表（clothing, outfit, outfit_item, diary, user_profile, image_queue）启用 Supabase RLS 策略：

```sql
-- 用户只能读写自己的数据
ALTER TABLE clothing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_isolation" ON clothing
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

compliments 表为公共读（所有用户共享夸赞库），无需 user_id。**MVP 预置要求**：夸赞库需预置 ≥ 40 条夸赞（6 种穿搭标签 × 至少 8 条），覆盖 4 种性格标签。夸赞数据通过管理脚本或 Supabase Dashboard 直接写入，不提供前端 INSERT 接口（需准备 seed SQL 文件导入）。

### 3.9 数据库索引策略

以下索引按 MVP 查询模式设计，在 Supabase 免费额度内足够使用：

```sql
-- clothing: 衣柜列表查询（用户+分类+风格筛选）
CREATE INDEX idx_clothing_user_category ON clothing(user_id, category);
CREATE INDEX idx_clothing_user_style ON clothing(user_id, style);
CREATE INDEX idx_clothing_temp_range ON clothing(user_id, temp_min, temp_max);

-- outfit: 推荐列表 & 收藏列表
CREATE INDEX idx_outfit_user_recommended ON outfit(user_id, is_recommended);
CREATE INDEX idx_outfit_user_favorite ON outfit(user_id, is_favorite);

-- outfit_item: 搭配详情 JOIN
CREATE INDEX idx_outfit_item_outfit ON outfit_item(outfit_id);

-- diary: 日历视图
CREATE INDEX idx_diary_user_date ON diary(user_id, date);

-- image_queue: 处理状态查询
CREATE INDEX idx_image_queue_user_status ON image_queue(user_id, status);
```

> MVP 阶段数据量小（单用户衣物 < 200 件），上述索引为预防性设计。若 Supabase 免费版出现慢查询，优先检查 `clothing` 表是否缺少复合索引。

---

## 四、页面与组件结构

### 4.1 页面结构

4 个页面（含认证）：

```
登录/注册页（Supabase Auth）
  ├── 邮箱 + 密码注册（注册成功→跳转登录页）
  ├── 手机号或邮箱 + 密码登录
  ├── 邮箱 + 验证码登录
  └── 邮箱找回密码（发送验证码→验证→重置密码）

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

**存储**：问卷进度存储在 `localStorage`，key 为 `outfit_onboarding_v1`，value 为 `{ step: number, answers: {...}, started_at: ISO }`。下次打开时检测该 key → 存在且未完成则恢复进度；已完成（`onboarding_done = TRUE`）则清除该 key。

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
4. 按风格分组，生成候选搭配组合（算法见 6.1.1）
5. 颜色冲突检测（主色 ≤ 3 个）、风格一致性、厚薄一致（规则见 6.1.3）
6. 评分排序，取 Top 3，确保风格差异化
7. 返回结果

#### 6.1.1 候选搭配生成策略

采用**启发式剪枝**，避免全排列爆炸：

```
输入：筛选后的衣物，按 slot 分组：top[], bottom[], dress[], outerwear[], shoes[], accessory[]

1. 确定搭配骨架：
   - 连衣裙模式：从 dress[] 选 1 + shoes (必选) + outerwear (可选) + accessory (可选)
   - 分体模式：从 top[] 选 1 + bottom[] 选 1 + shoes (必选) + outerwear (可选) + accessory (可选)
   - 每套搭配必选 slot 数量：连衣裙模式 2-4 件，分体模式 2-5 件

2. 风格分组剪枝：
   - 每个 slot 内按 style 分组，只保留同一风格组内 temp 匹配度最高的 3 件
   - 不同风格的衣物不在同一套搭配中混搭（除非风格差异化阶段放宽）

3. 候选上限：
   - 每套骨架最多生成 30 个候选（dress 模式：1×3×3=9 或 分体模式：3×3×3×3×3=243 → 限制在 30 内）
   - 超过上限时优先保留风格与用户偏好匹配的候选

4. 合并所有骨架的候选进入评分池
```

#### 6.1.2 降水过滤规则

降水天气（降水概率 > 50%）触发以下过滤：

| 过滤 | 逻辑 |
|------|------|
| 鞋子排除 | subcategory ∈ {sandals, flats_canvas, sneakers_canvas} OR material = 'canvas' → 排除 |
| 外套过滤 | waterproof = FALSE 且 category = 'outerwear' → 排除（或降权 50%） |
| 下装建议 | color 为白色/浅色的 bottom → 降权（易脏） |

> MVP 阶段 material 字段覆盖率可能不足（旧衣物未填写），此时仅按 subcategory 粗略过滤。

#### 6.1.3 冲突检测规则

**颜色冲突**：
- 主色定义为衣物 `color_hex`，一套搭配中不同主色 ≤ 3 个
- 黑白灰属于中性色，不计入主色数量
- 同色系（色相差 ≤ 30°）视为同一主色

**风格一致性**：
- 搭配内所有衣物的 style 至少有 1 个公共标签
- 无公共标签则标记为风格不一致，降权 50%（不直接排除，允许跨风格搭配）

**厚薄一致**：
- 搭配内衣物 thickness 跨级不超过 1 级（thin/medium/thick/down）
- 如 thin 和 thick 不可同套，但 thin 和 medium 可同套

**无候选时的降级**：
- 逐步放宽约束：风格一致性 → 降低厚薄限制 → 放宽主色上限到 4
- 仍无候选则提示"暂无合适搭配，请添加更多衣物"

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

**冷启动权重适配**：新用户无收藏数据时，收藏偏好权重(0.2)和风格偏好权重(0.25)中 Onboarding 未完成部分不生效。冷启动时临时重新分配权重，随收藏数据积累逐步回归：

| 阶段 | 天气匹配 | 风格偏好 | 通勤适配 | 收藏偏好 |
|------|----------|----------|----------|----------|
| 冷启动（收藏 < 5） | 0.55 | 0.2 | 0.15 | 0.1 |
| 过渡期（收藏 5-20） | 0.45 | 0.25 | 0.15 | 0.15 |
| 成熟期（收藏 > 20） | 0.4 | 0.25 | 0.15 | 0.2 |

> 冷启动阈值每日动态计算，随 `user_profile.fav_clothing_ids` 长度自动切换。

### 6.3 降级策略

| 异常 | 降级 |
|------|------|
| 天气 API 失败 | 展示缓存天气 + "天气可能不是最新"。缓存超过 24 小时 → 尝试 Open-Meteo API（完全免费，无需注册，全球覆盖）|
| 温度匹配无结果 | 放宽 ±3°C；仍无则提示"暂无合适衣物" |
| 衣柜 < 5 件 | 能做几套做几套，引导加衣物 |
| 风格不足 3 种 | 放宽风格约束，允许同风格不同单品 |

---

## 七、Canvas 2D 模特渲染方案

### 7.1 整体方案

采用 **Canvas 分层叠加** 渲染：模特底图作为底层，衣物透明 PNG 按 slot 顺序叠加到对应位置。

### 7.2 资源准备

**模特底图**：
- 准备一组中性姿势的模特底图（SVG 或高分辨率 PNG），男女各 1 套
- 底图仅包含身体轮廓和头部，不含衣物
- 尺寸基准：Canvas 逻辑尺寸 375×600px（iPhone 6/7/8 比例），实际渲染按设备像素比缩放

**衣物素材**：
- 所有衣物经 `@imgly/background-removal` 处理后为透明 PNG
- 上传时自动压缩到 800px 宽（保持比例），平衡清晰度与加载速度
- 每件衣物存储时附带 `anchor` 和 `scale` 元数据（见 7.3）

### 7.3 坐标与锚点体系

每件衣物在 `clothing` 表新增两个字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| anchor_x | FLOAT | 衣物锚点 X（相对于 Canvas 宽度的比例，0-1） |
| anchor_y | FLOAT | 衣物锚点 Y（相对于 Canvas 高度的比例，0-1） |
| scale_x | FLOAT | 水平缩放系数，默认 1.0 |
| scale_y | FLOAT | 垂直缩放系数，默认 1.0 |

各 slot 默认锚点位置（后续可通过 UI 微调）：

| Slot | anchor_x | anchor_y | 说明 |
|------|----------|----------|------|
| top | 0.5 | 0.28 | 上衣中心对齐模特胸部 |
| bottom | 0.5 | 0.58 | 裤装腰部对齐模特腰线 |
| dress | 0.5 | 0.25 | 连衣裙从肩部开始 |
| outerwear | 0.5 | 0.28 | 外套与上衣同锚点 |
| shoes | 0.5 | 0.82 | 鞋子对齐脚部 |
| accessory | 按具体配饰 | 按具体配饰 | 帽子 0.5/0.08，项链 0.5/0.2 等 |

### 7.4 渲染顺序（z-index）

Canvas 从底层到顶层按 `layer_order` 升序绘制：

```
layer 1: shoes        （最底层）
layer 2: bottom       （裤装/裙子，在鞋子上方覆盖鞋腰）
layer 3: top          （上衣主体）
layer 4: dress        （连衣裙，与 top/bottom 互斥）
layer 5: outerwear    （外套，叠穿在上衣外）
layer 6: accessory    （最顶层，配饰叠加在所有衣物上）
```

**绘制逻辑**：
```ts
function renderOutfit(ctx: CanvasRenderingContext2D, items: OutfitItem[]) {
  // 1. 绘制模特底图
  ctx.drawImage(modelBase, 0, 0, canvasWidth, canvasHeight);

  // 2. 按 layer_order 升序绘制衣物
  const sorted = [...items].sort((a, b) => a.layer_order - b.layer_order);
  for (const item of sorted) {
    const img = imageCache.get(item.clothing.image_naked);
    const { anchor_x, anchor_y, scale_x, scale_y } = item.clothing;
    const x = canvasWidth * anchor_x - (img.width * scale_x) / 2;
    const y = canvasHeight * anchor_y - (img.height * scale_y) / 2;
    ctx.drawImage(img, x, y, img.width * scale_x, img.height * scale_y);
  }
}
```

### 7.5 叠穿规则

同一 slot 允许多件衣物（如内搭 T恤 + 外穿衬衫），通过 `layer_order` 区分：

| layer_order | 示例 | 说明 |
|-------------|------|------|
| 1 | 打底衫 | 贴身穿 |
| 2 | 衬衫/T恤 | 主上衣 |
| 3 | 毛衣/卫衣 | 穿在主上衣外 |
| 4 | 外套/夹克 | 最外层 |

> MVP 限制：同 slot 最多 2 层叠穿。`layer_order` 在录入衣物时由用户选择或使用类别默认值。

### 7.6 移动端适配

- Canvas 逻辑尺寸 375×600，通过 `devicePixelRatio` 自动适配 Retina 屏
- 渲染前检测 Canvas 可用宽度（`containerWidth`），等比缩放
- 衣物图片预加载到内存缓存，切换搭配时无闪烁

**图片缓存策略**：
- 预加载缓存上限 30 张图片，超出后 LRU 淘汰
- 切换搭配时，当前搭配图片优先加载，非当前搭配图片延迟 200ms 加载
- 缓存未命中时展示占位色块（取 `clothing.color_hex` 作为背景色），避免空白闪烁
- MVP 可简化为直接加载（不做 LRU），代价是首次切换有短暂白屏

---

## 八、夸赞系统（PraiseBanner）

### 8.1 展示逻辑

- 位于首页天气卡下方、模特上方
- 内容与当前展示的搭配联动（不是随机夸）
- 切换搭配时夸赞联动更新

### 8.2 匹配规则

搭配汇总特征标签（如吊带+裙子 → {"露肩", "裙子", "甜美"}），从夸赞库筛选命中标签的夸赞 → 按性格标签过滤 → 排除近期已展示 → 随机选一条。

### 8.3 多样化

- 每个标签至少 8-10 条夸赞
- localStorage 记录最近 10 条已展示，选择时排除
- 确保同标签不同夸赞，不同时间看到不同内容

### 8.4 文案原则

夸细节、夸选择、夸气质，不夸空话。建议 50 字以内。需与搭配实际特征匹配（露肩才夸锁骨，裙子才夸腰线，运动才夸活力）。

---

## 九、图片自动处理

### 9.1 上传前预处理（移动端性能关键）

用户上传图片后，在送入抠图前先做 Canvas 压缩：

1. 将图片绘制到离屏 Canvas，缩放到 **宽 ≤ 1024px**（保持比例）
2. 输出 JPEG quality=0.85，大幅减小送入 @imgly 的像素量
3. 压缩后的文件上传至 Supabase Storage 作为 `image_original`

> 未经压缩的原图在手机浏览器中抠图可能耗时 30+ 秒甚至有 OOM 风险。压缩到 1024px 宽后移动端处理时间可控制在 5-10 秒内。

### 9.2 存储尺寸限制

- `image_original`（电商原图）：压缩后宽 ≤ 1024px
- `image_naked`（去背景透明 PNG）：宽固定 800px，CSS `image-rendering: auto` 保证渲染质量
- 单张图片文件大小建议 ≤ 500KB，Supabase 免费存储 1GB、带宽 2GB/月

### 9.3 处理流程

1. 用户粘贴电商图 URL 或上传文件 → **Canvas 预压缩**（1024px 宽）
2. 保存至 Supabase Storage → `image_original`
3. @imgly/background-removal 在 Web Worker 中运行去背景
4. 成功 → 缩放至 800px 宽，透明 PNG 存为 `image_naked`
5. 失败 → `image_queue` 标记 failed，提示用户换图或手动上传

---

## 十、收藏反馈闭环

用户收藏搭配 → 系统提取风格、品类、颜色、单品、搭配结构 5 个维度的偏好 → 更新 user_profile 偏好字段 → 下次推荐加权匹配。

冷启动时收藏偏好权重为 0，随收藏增多权重逐渐生效，推荐越来越准。

---

## 十一、错误处理

### 11.1 网络异常
- 天气 API 失败 → 缓存天气 + "天气可能不是最新" 黄色标签
- Supabase 失败 → localStorage 缓存上一次数据 + 红色提示条
- 图片上传失败 → 保留表单内容 + 重试按钮
- 全部 API 不可用 → 展示 localStorage 中缓存的上次推荐快照（非 PWA 离线模式，仅数据缓存）

### 11.2 空状态
- 首页无推荐 → 引导加衣物
- 衣柜空 → 插图 + "添加第一件衣物"
- 无收藏 → "去首页看看推荐"
- 无日记 → "今天还没记录"

### 11.3 加载状态
- 首页首次加载 → 骨架屏
- 推荐生成中 → 脉冲动画 "正在搭配..."
- 图片抠图中 → 进度条
- 衣柜列表 → 6 个灰色卡片骨架

### 11.4 边界情况
- 衣柜 < 2 件 → 不硬凑 3 套
- 全部同风格 → 放宽差异化约束
- 极端天气无匹配 → 放宽温度 ±5°C
- 问卷未完成退出 → 提供"跳过问卷"按钮（顶部，文案清晰），跳过后所有偏好字段使用默认中性值；未跳过但中途退出 → 下次打开原地恢复问卷进度<br>**冷启动夸赞**：首次使用且衣柜空 → 推荐为空，PraiseBanner 展示性格匹配的通用鼓励语（如"期待你的第一件衣服哦"），不展示错误状态
- 抠图失败 → 标记待处理，可重新处理或手动上传
- 同一天反复打开 → 当天日期 key 缓存

---

## 十二、二期规划（本次不实现）

- 3D 模特（Three.js 贴图方案）
- PWA 离线能力
- 夸赞互动效果
- 微信小程序版本
- 定时推送提醒
- AI 生成夸赞文案
- 穿搭社区/分享

---

## 十三、预算

| 项目 | 费用 |
|------|------|
| 域名（可选） | ~50 元/年 |
| 服务器 | 免费（Vercel + Supabase 免费额度） |
| 天气 API | 免费（和风天气 1000次/天） |
| **总计** | **几乎零成本** |

---

> **下一步**：审核通过后，进入实施计划（writing-plans）。
