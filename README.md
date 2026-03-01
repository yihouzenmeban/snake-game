# 贪吃蛇

这是一个纯 Codex 的学习使用开发项目，内容是一个用 React、Vite 和 TypeScript 实现的贪吃蛇小游戏。

## 功能

- 分数、最高分和速度等级展示
- 键盘方向键 / `WASD` 控制
- 移动端棋盘滑动控制
- `空格` / `P` 暂停与继续
- `ESC` 退出当前游戏
- `Enter` 快速重新开始
- 游戏说明弹窗与游戏结束弹窗
- 基于 Vitest 的最小逻辑测试

## 本地运行

```bash
pnpm install
pnpm dev
```

## 常用命令

```bash
pnpm dev
pnpm build
pnpm test
pnpm preview
```

- `pnpm dev`：启动本地开发服务器
- `pnpm build`：类型检查并构建
- `pnpm test`：运行单元测试
- `pnpm preview`：预览构建结果

## 操作说明

- 方向键 / `WASD`：控制移动方向
- 在棋盘上滑动：控制移动方向
- `空格` / `P`：暂停或继续
- `ESC`：退出当前游戏
- `Enter`：重新开始
- 点击顶部“游戏说明”：查看操作介绍

## 技术栈

- React
- Vite
- TypeScript
- Vitest

## 项目结构

```text
src/
  App.tsx       游戏逻辑与界面
  App.test.ts   逻辑测试
  index.css     样式
  main.tsx      入口
```

## 验证

- `pnpm test`：覆盖速度计算和触屏滑动方向判定
- `pnpm build`：检查类型并构建产物

当前自动化测试主要覆盖：

- 速度计算
- 触屏滑动方向判定
