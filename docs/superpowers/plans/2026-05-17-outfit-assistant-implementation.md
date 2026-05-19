# 穿搭助手 实施计划大纲

> **目标:** 基于 spec 完成一个天气驱动的每日穿搭推荐 Web App（React SPA + Supabase BaaS + Vercel 部署）
>
> **架构:** React 18 + Vite + TypeScript + Tailwind CSS + Zustand（前端），Supabase（Auth / PostgreSQL / Storage / Edge Functions），@imgly/background-removal（客户端抠图）
>
> **策略:** 分 7 个 Phase，每 Phase 结束后提交，可独立验证

---

## 文件结构总览

```
src/
├── main.tsx / App.tsx
├── lib/
│   ├── supabase.ts            # Supabase 客户端
│   ├── types.ts               # 全局类型定义
│   ├── constants.ts            # 天气/风格/通勤等常量
│   ├── recommendation.ts       # 推荐引擎核心
│   └── praise.ts              # 夸赞匹配逻辑
├── stores/
│   ├── authStore.ts
│   ├── wardrobeStore.ts
│   └── outfitStore.ts
├── hooks/
│   ├── useWeather.ts
│   └── useImageProcessing.ts
├── components/
│   ├── auth/                  # LoginPage, AuthForm
│   ├── onboarding/            # OnboardingModal
│   ├── home/                  # HomePage, WeatherCard, PraiseBanner, ModelViewer, OutfitSwitcher, OutfitActions
│   ├── wardrobe/              # WardrobePage, CategoryTabs, FilterBar, ClothingGrid, ClothingForm
│   ├── outfits/               # OutfitsPage, OutfitList, OutfitCalendar, OutfitEditor
│   └── ui/                    # BottomNav, ImageUploader, LoadingState, EmptyState, ErrorState, Layout
├── workers/
│   └── imageProcessor.ts      # Web Worker：抠图 + 心跳
└── supabase/
    └── functions/
        └── weather/index.ts   # Edge Function：天气 API 代理
```

---

## Phase 0: 项目脚手架

| # | 任务 | 内容 |
|---|------|------|
| 0.1 | 初始化 Vite 项目 | **注意：目录已存在** — 先 `cd /tmp && npm create vite@latest outfit-assistant-tmp -- --template react-ts`，然后将生成的文件（`package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/`）复制到项目目录，删除临时目录。然后 `npm install` 安装所有依赖（react-router-dom, zustand, @supabase/supabase-js, @imgly/background-removal, tailwindcss, @tailwindcss/vite, vitest, @testing-library/react 等） |
| 0.2 | 配置 Tailwind + 基础样式 | `tokens.css` 设计 token，`global.css` 基础重置，`tailwind.config` 主题扩展 |
| 0.3 | 创建目录结构 | 按文件结构总览创建所有空文件夹 + 入口文件骨架 |
| 0.4 | Supabase CLI 本地环境 | `npx supabase init` 初始化本地 Supabase 项目（生成 `supabase/` 目录）。后续 `npx supabase start` 启动本地 PostgreSQL + Storage 用于开发调试 Edge Functions。⚠️ 依赖 Docker Desktop，需提前安装 |
| 0.5 | TypeScript 类型定义 | `lib/types.ts` 定义所有数据模型（Clothing, Outfit, OutfitItem, Diary, UserProfile, Compliment, ImageQueue） |
| 0.6 | 常量定义 | `lib/constants.ts` 定义分类、风格、温度范围、通勤规则、锚点默认值等常量 |
| 0.7 | Supabase 客户端初始化 | `lib/supabase.ts` 初始化 supabase-js 实例 |
| 0.8 | 路由骨架 + Layout | React Router 配置：`/login`, `/`（首页+3 Tab），受保护路由守卫。创建 `Layout.tsx`（底部导航 `BottomNav` + `<Outlet/>`）作为首页 3 个 Tab 的共享壳 |
| 0.9 | Zustand Store 骨架 | 三个 store 的空壳（类型 + 初始状态） |
| 0.10 | Vitest 测试配置 | `vitest.config.ts` 配置 jsdom 环境、路径别名、coverage 阈值 80% |
| 0.11 | 扩展 .gitignore | 添加 `.env`, `.env.local`, `node_modules/`, `dist/`, `.claude/`, `*.tsbuildinfo`, `.supabase/` |
| 0.12 | 验证脚手架可运行 | `npm run dev` 启动零错误 |

## Phase 1: Supabase 后端

| # | 任务 | 内容 |
|---|------|------|
| 1.0 | 注册和风天气 API Key | 到 [dev.qweather.com](https://dev.qweather.com) 注册账号 → 创建项目 → 获取 API Key（免费版每日 1000 次）→ 记录到 `.env` 的 `VITE_QWEATHER_API_KEY` |
| 1.1 | 创建 Supabase 项目 | Dashboard 创建，获取 URL + anon key |
| 1.2 | 配置 Auth Providers | Supabase Dashboard → Authentication → Providers → 启用 **Email**（邮箱+密码/验证码）。SMS 短信验证码服务已放弃，所有验证码通过邮箱发送 |
| 1.3 | 数据库 Schema | 执行 SQL 创建 7 张表（clothing, outfit, outfit_item, diary, user_profile, compliments, image_queue） |
| 1.4 | 数据库索引 | 执行 spec 3.9 中 6 个索引 SQL（`idx_clothing_user_category`, `idx_clothing_user_style`, `idx_clothing_temp_range`, `idx_outfit_user_recommended`, `idx_outfit_user_favorite`, `idx_outfit_item_outfit`, `idx_diary_user_date`, `idx_image_queue_user_status`），创建后执行 `EXPLAIN` 验证索引生效 |
| 1.5 | Storage Bucket | 创建 2 个 bucket：`image_original`（压缩后电商原图，≤1024px）和 `image_naked`（去背景透明 PNG，800px）。配置 RLS：`auth.uid() = owner`，仅登录用户可读写自己的图片 |
| 1.6 | RLS 策略 | 6 张有 user_id 的表启用 RLS + `auth.uid() = user_id` 策略，compliments 公共读 |
| 1.7 | Seed 夸赞数据 | 预置 ≥ 40 条夸赞，覆盖 6 种穿搭标签 × 4 种性格标签 |
| 1.8 | 天气 Edge Function | `supabase/functions/weather/index.ts`：接收城市，调用和风天气 API，返回天气数据 |
| 1.9 | 环境变量配置 | Vite `.env` 配置 Supabase URL + anon key + 和风天气 API Key |

## Phase 2: 认证 + Onboarding

| # | 任务 | 内容 |
|---|------|------|
| 2.1 | Auth Store 实现 | `stores/authStore.ts`：session、user、signUp、signIn、signOut |
| 2.2 | 登录/注册页面 | `components/auth/`：邮箱注册（注册成功后跳转登录页）/ 手机号或邮箱+密码登录 / 邮箱验证码登录 / 邮箱找回密码。已放弃 SMS 短信验证码服务 |
| 2.3 | 路由守卫 | 未登录 → 重定向 `/login`，已登录但未完成 Onboarding → 弹窗 |
| 2.4 | Onboarding 问卷 | `components/onboarding/OnboardingModal.tsx`：3 步问卷（风格偏好、性格、通勤方式），`localStorage` 保存进度。**写回 Supabase 失败时自动重试 3 次（间隔 1s/2s/4s），全部失败则保留 localStorage 副本并在 UI 提示"稍后同步"，下次登录自动检测并重新尝试**。提供 **"跳过问卷"按钮**（顶部，文案清晰），跳过后所有偏好字段使用默认中性值，后续可在设置中重新填写 |
| 2.5 | User Profile 存储 | 问卷完成后写入 `user_profile` 表 |
| ~2.6~ | ~微信 OAuth（延后）~ | **延后至 v1.1**：微信登录需审核 AppID，MVP 阶段仅支持手机号+密码 |

## Phase 3: 衣柜

| # | 任务 | 内容 |
|---|------|------|
| 3.1 | Wardrobe Store | `stores/wardrobeStore.ts`：衣物 CRUD、分类筛选、上传状态 |
| 3.2 | 分类筛选栏 | `CategoryTabs.tsx`：top/bottom/dress/outerwear/shoes/accessory 切换，含空分类引导 |
| 3.3 | 颜色/风格筛选 | `FilterBar.tsx`：颜色标签、风格多选 |
| 3.4 | 衣物卡片网格 | `ClothingGrid.tsx`：2 列瀑布流，加载骨架屏，空状态（衣柜空时引导添加第一件衣物） |
| 3.5 | 衣物录入表单 | `ClothingForm.tsx`：Bottom Sheet，名称/分类/颜色/风格/厚薄/温度范围/防水/面料 + ImageUploader，含表单验证错误提示 |
| 3.6 | 图片上传 + 压缩 | `ImageUploader.tsx`：URL 粘贴或文件上传 → Canvas 压缩到 1024px → Supabase Storage，上传失败显示重试按钮 |
| 3.7 | 抠图 Web Worker | `workers/imageProcessor.ts`：@imgly 去背景 → 缩放到 800px → 上传 `image_naked` → 更新 `image_queue` 心跳。**降级策略：@imgly 加载失败（网络/CDN 不可用）时，提示用户"简化抠图暂时不可用"，跳过去背景步骤，直接使用原图压缩后上传，待网络恢复后可在衣物编辑中重新触发抠图**。**安全：`image_queue` 写入前需在前端校验 `clothing.user_id = auth.uid()`，防止 user_id 篡改** |
| 3.8 | 衣柜页面组装 | `WardrobePage.tsx` 组合所有组件，含编辑/删除功能，无数据时空状态引导 |

## Phase 4: 推荐引擎

| # | 任务 | 内容 |
|---|------|------|
| 4.1 | 天气 Hook | `hooks/useWeather.ts`：调用 Edge Function → 和风天气 → 返回明日天气，缓存 + 降级到 Open-Meteo |
| 4.2 | 推荐核心算法 | `lib/recommendation.ts`：温度筛选（temp_min ≤ 最高温 AND temp_max ≥ 最低温）→ 降水过滤（下雨排除凉鞋/布面鞋/无防水外套）→ 风格分组剪枝 → 候选生成（连衣裙/分体模式）→ 冲突检测（颜色/风格/厚薄）→ 评分排序 → Top 3。无候选时逐步放宽约束（±3°C → 放宽风格 → 放宽厚薄 → 放宽主色） |
| 4.3 | 通勤约束过滤 | 根据 `user_profile.commute` 排除不合适衣物（骑车排除短裙/凉鞋等） |
| 4.4 | 冷启动权重适配 | 根据收藏量动态调整四维评分权重（冷启动/过渡期/成熟期） |
| 4.5 | 收藏反馈闭环 | 收藏搭配时更新 `user_profile` 偏好计数（风格/品类/颜色/单品/搭配结构） |
| 4.6 | 夸赞匹配逻辑 | `lib/praise.ts`：接收搭配特征标签（从衣物提取：品类→标签映射 如吊带→露肩、裙子→裙装）+ 用户性格 → 从 compliments 表筛选命中标签的夸赞 → 按 personality_tags 过滤 → 排除 localStorage 记录的最近 10 条已展示 → 随机选 1 条。无匹配时返回性格通用鼓励语 |
| 4.7 | 单元测试 | 推荐算法 + 夸赞匹配测试用例（温度筛选、降水过滤、颜色冲突、风格分组、冷启动权重、标签匹配、去重排除、无候选降级、空衣柜 fallback） |
| 4.8 | 推荐结果持久化 | 推荐引擎产出 Top 3 后，写入 `outfit` 表（is_recommended=true, weather_condition=当前天气）和 `outfit_item` 表（每件衣物的 slot + layer_order）。写入前先 DELETE 该用户当天的旧推荐（按 `user_id + date + is_recommended`），避免重复累积 |

---

### 🔗 Phase 3 → Phase 5 联调里程碑

在进入 Phase 5 之前，确保以下数据链路可走通：

- [ ] 衣柜中有 ≥ 3 件上衣 + ≥ 3 件下装 + ≥ 1 件连衣裙（或手动插入测试数据）
- [ ] 推荐引擎能基于测试衣物产出 ≥ 1 套搭配（`lib/recommendation.ts` 单元测试通过）
- [ ] 天气 Hook 可获取真实或 mock 天气数据
- [ ] 用户已通过 Onboarding（`user_profile` 有风格/通勤偏好）

---

## Phase 5: 首页

| # | 任务 | 内容 |
|---|------|------|
| 5.0 | 准备模特底图资源 | 准备 1-2 张素体模特 PNG 底图（无衣着，正面站立），放入 `public/models/` 目录，Canvas 渲染以此为底层 |
| 5.1 | WeatherCard | 天气信息条：温度范围、天气图标、风力、降水概率，含降级提示 |
| 5.2a | Canvas 2D 模特渲染 — 基础渲染 | `ModelViewer.tsx`：分层叠加渲染（模特底图 → 衣物按 layer_order 叠加），图片预加载 + 加载骨架屏 |
| 5.2b | Canvas 2D 模特渲染 — 缓存策略 | 渲染前检查 IndexedDB 缓存（key: `outfit_${outfitId}_${size}`），命中直接读取；未命中则渲染后写入。搭配切换时预加载相邻搭配到缓存 |
| 5.3 | 夸赞横幅 | `PraiseBanner.tsx`：调用 `lib/praise.ts` 获取匹配夸赞，随搭配切换联动。**冷启动兜底**：衣柜为空时展示性格匹配的通用鼓励语（如"期待你的第一件衣服哦～"），不展示错误状态 |
| 5.4 | 搭配切换器 | `OutfitSwitcher.tsx`：左右滑动/按钮切换 3 套搭配，联动 ModelViewer + PraiseBanner |
| 5.5 | 搭配操作栏 | `OutfitActions.tsx`：收藏 / 换一批 / 自由搭配进入编辑器 |
| 5.6 | 首页组装 | `HomePage.tsx` 组合所有组件，骨架屏 + 脉冲动画"正在搭配..."，天气获取失败降级提示，无推荐时引导录入衣物。**加载逻辑**：先查 `outfit` 表是否有当天推荐（`is_recommended = true AND created_at::date = today`）→ 有则直接展示 → 无则调推荐引擎 → 持久化 → 展示。避免每次打开重复生成 |

## Phase 6: 我的搭配

| # | 任务 | 内容 |
|---|------|------|
| 6.1 | Outfit Store | `stores/outfitStore.ts`：搭配列表、收藏、日记 CRUD |
| 6.2 | 收藏搭配列表 | `OutfitList.tsx`：收藏 + 自搭列表，可切换，空列表引导 |
| 6.3 | 穿搭日历 | `OutfitCalendar.tsx`：日历视图，展示每日穿搭，可记录/编辑 |
| 6.4 | 穿搭日记 | 点击日历日期 → 选搭配 → 评分(1-5) → 备注 → 保存到 `diary` 表 |
| 6.5 | 自由搭配编辑器 | `OutfitEditor.tsx`：从衣柜拖选衣物组合成搭配，保存为自定义搭配 |
| 6.6 | 我的搭配页面 | `OutfitsPage.tsx` 组合列表、日历、编辑器，加载/空状态/错误处理内联在各子组件中 |

## Phase 7: 打磨 & 部署

| # | 任务 | 内容 |
|---|------|------|
| 7.1 | 全局异常兜底 | `ErrorState` 组件 + ErrorBoundary 包裹首页/衣柜/搭配三个主 Tab，捕获渲染崩溃，提供"刷新页面"按钮 |
| 7.2 | 网络状态监听 | 离线检测 → 提示"当前离线"，在线恢复后自动重试失败请求 |
| 7.3 | 响应式适配 | 320/375/768px 断点测试，底部导航，Canvas 自适应 |
| 7.4 | image_queue 超时恢复 | 检测 `processing` 超时记录（>5分钟）→ 自动重置为 `pending`，下次心跳触发重试；`retry_count ≥ 3` 的记录标记为 `failed`，停止自动重试，提示用户手动处理 |
| 7.5 | Vercel 部署 | 关联 GitHub → 配置环境变量（Supabase URL + anon key） → 自动部署 |
| 7.6 | E2E 冒烟测试 | 核心流程：登录 → Onboarding → 加衣物 → 看推荐 → 收藏 |

---

## 执行顺序

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → [联调里程碑] → Phase 5 → Phase 6 → Phase 7
```

Phase 3 和 Phase 4 可部分并行（推荐引擎纯逻辑不依赖 UI），Phase 5/6 都依赖 Phase 3/4。

## 外部依赖清单

| 依赖 | 获取方式 | Phase |
|------|----------|-------|
| 和风天气 API Key | [dev.qweather.com](https://dev.qweather.com) 免费注册 | Phase 1 |
| Supabase 项目 | [supabase.com](https://supabase.com) 免费创建 | Phase 1 |
| 模特素体底图 | AI 生成或素材库获取，放入 `public/models/` | Phase 5 |
| Vercel 账号 | [vercel.com](https://vercel.com) 免费注册（Hobby plan） | Phase 7 |

## 延后功能（v1.1+）

- 微信 OAuth 登录（需微信开放平台审核）
- 多语言支持
- 社交分享功能
