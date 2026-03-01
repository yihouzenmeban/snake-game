# Repository Guidelines

## Project Structure & Module Organization
本仓库是一个基于 Vite、React 和 TypeScript 的小游戏项目。应用代码位于 `src/`：`main.tsx` 负责挂载 React，`App.tsx` 包含主要游戏逻辑，`index.css` 存放全局样式。根目录配置文件包括 `vite.config.ts`、`tsconfig.json` 和 `package.json`。构建产物输出到 `dist/`，不要手动修改。

## Build, Test, and Development Commands
请统一使用 `pnpm`，版本已在 `package.json` 中声明。

- `pnpm install`：安装依赖。
- `pnpm dev`：启动本地 Vite 开发服务器，便于调试交互。
- `pnpm build`：先执行 `tsc --noEmit` 做类型检查，再构建生产包到 `dist/`。
- `pnpm preview`：本地预览构建后的产物。

提交 PR 前至少运行一次 `pnpm build`；这是当前项目里最快的整体正确性检查。

## Coding Style & Naming Conventions
遵循现有的 TypeScript 优先风格：2 空格缩进，语句保留分号。React 组件使用 `PascalCase`，函数和变量使用 `camelCase`，模块级常量使用 `UPPER_SNAKE_CASE`。相关逻辑尽量放在使用位置附近，优先写明确类型；新增样式类名时保持当前 CSS 命名方式，如 `panel__header`、`score-card--secondary`。

## Testing Guidelines
目前仓库还没有配置自动化测试。现阶段请通过 `pnpm build` 以及 `pnpm dev` 下的手动试玩来验证改动。如果后续补充测试，建议与功能文件相邻放置，或放入未来的 `src/__tests__/` 目录，并使用 `.test.ts` 或 `.test.tsx` 作为文件后缀。

## Commit & Pull Request Guidelines
最近的提交历史采用简短的 Conventional Commits 风格，例如 `feat: initial snake game`、`feat: add pause and high score`。请继续使用 `feat:`、`fix:`、`refactor:` 等前缀，并配上简洁摘要；本仓库的提交信息默认使用中文，例如 `docs: 新增仓库贡献指南`。PR 需要说明用户可见的改动、列出验证步骤；如果涉及界面变化，请附截图或简短录屏。

## Security & Configuration Tips
不要提交任何密钥、`.env` 内容或 `dist/` 下的生成文件。像 `localStorage` 这类浏览器侧状态键名应尽量保持稳定，除非这次改动明确包含迁移逻辑。
