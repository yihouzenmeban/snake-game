# Repository Guidelines

## Project Structure & Module Organization
本仓库是一个基于 Vite、React 和 TypeScript 的小游戏项目。应用代码位于 `src/`：`main.tsx` 负责挂载 React，`App.tsx` 包含主要游戏逻辑，`index.css` 存放全局样式。根目录配置文件包括 `vite.config.ts`、`tsconfig.json` 和 `package.json`。构建产物输出到 `dist/`，不要手动修改。

凡是影响开发流程、测试方式、构建命令、提交规范或项目结构的改动，提交时必须同步更新 `AGENTS.md`。

## Build, Test, and Development Commands
请统一使用 `pnpm`，版本已在 `package.json` 中声明。

- `pnpm install`：安装依赖。
- `pnpm dev`：启动本地 Vite 开发服务器，便于调试交互。
- `pnpm build`：先执行 `tsc --noEmit` 做类型检查，再构建生产包到 `dist/`。
- `pnpm test`：运行基于 Vitest 的单元测试，当前覆盖速度曲线与触屏手势方向判定。
- `pnpm preview`：本地预览构建后的产物。

提交 PR 前至少运行一次 `pnpm build`；涉及游戏逻辑修改时，额外运行一次 `pnpm test`。

## Coding Style & Naming Conventions
遵循现有的 TypeScript 优先风格：2 空格缩进，语句保留分号。React 组件使用 `PascalCase`，函数和变量使用 `camelCase`，模块级常量使用 `UPPER_SNAKE_CASE`。相关逻辑尽量放在使用位置附近，优先写明确类型；新增样式类名时保持当前 CSS 命名方式，如 `panel__header`、`score-card--secondary`。

## Testing Guidelines
仓库已配置最小自动化测试，当前测试文件与功能文件相邻放置，例如 `src/App.test.ts`。优先为纯逻辑补测试，例如速度计算、手势方向判定这类不依赖 DOM 的函数；涉及交互体验的改动仍建议结合 `pnpm dev` 做手动试玩。测试文件使用 `.test.ts` 或 `.test.tsx` 后缀。

## Commit & Pull Request Guidelines
最近的提交历史采用简短的 Conventional Commits 风格。请继续使用 `feat:`、`fix:`、`refactor:`、`docs:` 等前缀，并配上中文摘要，例如 `feat: 增加暂停和最高分`。PR 需要说明用户可见的改动、列出验证步骤；如果涉及界面变化，请附截图或简短录屏。

## Security & Configuration Tips
不要提交任何密钥、`.env` 内容或 `dist/` 下的生成文件。像 `localStorage` 这类浏览器侧状态键名应尽量保持稳定，除非这次改动明确包含迁移逻辑。
