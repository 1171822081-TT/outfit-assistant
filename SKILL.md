---
name: outfit-assistant-patterns
description: Coding patterns extracted from 穿搭助手 (Outfit Assistant) repository
version: 1.0.0
source: local-git-analysis
analyzed_commits: 1
---

# 穿搭助手 项目编码模式

## 提交约定

本项目使用 **约定式提交 (Conventional Commits)**：
- `chore:` - 维护任务
- `feat:` - 新功能
- `fix:` - Bug 修复
- `docs:` - 文档更新
- `refactor:` - 重构
- `test:` - 测试
- `perf:` - 性能优化
- `ci:` - CI/CD 变更

## 项目架构

```
.
├── .agents/              # Claude Code 技能（前端设计、Web 测试）
│   └── skills/
├── .superpowers/         # 头脑风暴会话状态
│   └── brainstorm/
├── docs/                 # 项目文档
│   └── superpowers/specs/  # 技术设计文档（按日期命名）
├── 穿搭助手/              # 功能模块（中文目录名）
│   └── 需求文档.md
├── CLAUDE.md             # AI 协作规则
├── skills-lock.json      # 技能版本锁定
└── SKILL.md              # 编码模式（本文件）
```

## AI 协作工作流

本项目依赖两个技能体系：

### Superpowers（核心流程）
- `superpowers:brainstorming` — 需求分析与头脑风暴
- `superpowers:writing-plans` — 编写实施计划
- `superpowers:executing-plans` — 按计划逐步执行
- `superpowers:test-driven-development` — TDD 开发
- `superpowers:systematic-debugging` — 系统化调试
- `superpowers:requesting-code-review` — 常规代码审查

### ECC（专项深度任务）
- `everything-claude-code:security-review` — 安全漏洞扫描
- `everything-claude-code:database-review` — 数据库架构审查
- `everything-claude-code:e2e` — 端到端测试
- `everything-claude-code:xxx-review` — 特定语言深度审查

## 开发工作流

### 功能实现流程
1. **需求分析** → 使用 `superpowers:brainstorming`
2. **编写计划** → 使用 `superpowers:writing-plans`，产出设计文档到 `docs/superpowers/specs/`
3. **逐步执行** → 使用 `superpowers:executing-plans`
4. **TDD 开发** → 使用 `superpowers:test-driven-development`
5. **代码审查** → 使用 `superpowers:requesting-code-review`

### 文档命名规范
- 技术设计文档：`docs/superpowers/specs/YYYY-MM-DD-<feature-name>-design.md`

## 技术栈约定

| 层 | 选型 |
|----|------|
| 前端框架 | React 18 + Vite + TypeScript |
| 样式 | Tailwind CSS |
| 路由 | React Router v6 |
| 后端 | Supabase BaaS（Auth + PostgreSQL + Storage） |
| 部署 | Vercel |
| 天气 API | 和风天气 |

## 环境约束

- Playwright/Chromium：因网络限制使用系统 Chrome，Python 脚本中设置 `channel="chrome"` 或 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
- 零服务器成本：所有服务使用免费 BaaS 额度
