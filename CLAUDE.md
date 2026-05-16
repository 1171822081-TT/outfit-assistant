# AI 技能分工规则

在日常开发中，请严格遵守以下分工：

## 核心流程（由 Superpowers 主导）
- **需求分析与头脑风暴**：使用 `superpowers:brainstorming`
- **编写实施计划**：使用 `superpowers:writing-plans`
- **按计划逐步执行**：使用 `superpowers:executing-plans`
- **日常代码开发与 TDD**：使用 `superpowers:test-driven-development`
- **遇到 Bug 时的系统化调试**：使用 `superpowers:systematic-debugging`
- **常规代码审查**：使用 `superpowers:requesting-code-review`

## 专项深度任务（由 ECC 主导）
- **生产级安全漏洞扫描**：使用 `everything-claude-code:security-review`
- **数据库架构审查**：使用 `everything-claude-code:database-review`
- **端到端（E2E）自动化测试**：使用 `everything-claude-code:e2e`
- **特定语言（如 Go/Python）的深度代码审查**：使用 `everything-claude-code:xxx-review`

## 环境配置
- **Playwright/Chromium**: 网络限制无法下载 Chromium，使用系统 Chrome 替代。Python 脚本中应使用 `channel="chrome"` 或设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
