# 仓库指南

## 项目结构与模块组织
本仓库是一个基于 Vite、React 和 TypeScript 的小游戏项目。应用代码位于 `src/`：`main.tsx` 负责挂载 React，`App.tsx` 包含主要游戏逻辑，`index.css` 存放全局样式。根目录配置文件包括 `vite.config.ts`、`tsconfig.json` 和 `package.json`。构建产物输出到 `dist/`，不要手动修改。

凡是影响开发流程、测试方式、构建命令、提交规范或项目结构的改动，提交时必须同步更新 `AGENTS.md`。

## 构建、测试与开发命令
请统一使用 `pnpm`，版本已在 `package.json` 中声明。

- `pnpm install`：安装依赖。
- `pnpm dev`：启动本地 Vite 开发服务器，便于调试交互。
- `pnpm build`：先执行 `tsc --noEmit` 做类型检查，再构建生产包到 `dist/`。
- `pnpm test`：运行基于 Vitest 的逻辑与交互测试，并强制业务源码覆盖率四项达到 `100%`。
- `pnpm preview`：本地预览构建后的产物。

仓库启用了 `pre-commit` hook；每次 `git commit` 前都会自动执行 `pnpm test`，失败时不得绕过，除非用户明确要求。仓库还启用了 GitHub Pages 自动发布：推送到 `main` 后，GitHub Actions 会执行 `pnpm test`、`pnpm build` 并发布到 Pages。提交 PR 前至少运行一次 `pnpm build`；涉及游戏逻辑修改时，交付说明里要明确写出测试结果。

## 编码风格与命名约定
遵循现有的 TypeScript 优先风格：2 空格缩进，语句保留分号。React 组件使用 `PascalCase`，函数和变量使用 `camelCase`，模块级常量使用 `UPPER_SNAKE_CASE`。相关逻辑尽量放在使用位置附近，优先写明确类型；新增样式类名时保持当前 CSS 命名方式，如 `panel__header`、`score-card--secondary`。

## 测试约定
仓库已配置逻辑测试与组件交互测试，测试文件统一放在根目录 `test/`，例如 `test/game.test.ts`、`test/App.test.tsx`，测试初始化文件位于 `test/setup.ts`。新增或修改业务功能时，必须同步补齐相关测试，并保持业务源码覆盖率的 statements、branches、functions、lines 均为 `100%`。测试文件使用 `.test.ts` 或 `.test.tsx` 后缀；涉及界面体验的改动仍建议结合 `pnpm dev` 做手动试玩。

## 提交与 Pull Request 约定
最近的提交历史采用简短的 Conventional Commits 风格。请继续使用 `feat:`、`fix:`、`refactor:`、`docs:` 等前缀，并配上中文摘要，例如 `feat: 增加暂停和最高分`。PR 需要说明用户可见的改动、列出验证步骤；如果涉及界面变化，请附截图或简短录屏。

## 安全与配置提示
不要提交任何密钥、`.env` 内容或 `dist/` 下的生成文件。像 `localStorage` 这类浏览器侧状态键名应尽量保持稳定，除非这次改动明确包含迁移逻辑。若仓库名、Pages 地址或部署方式变化，必须同步更新 `vite.config.ts` 中的 `base`、GitHub Actions workflow、`README.md` 和 `AGENTS.md`。
