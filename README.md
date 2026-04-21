<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=240&color=0:0f766e,100:7dd3fc&text=Knight%20Markdown%20Studio&fontColor=ffffff&fontAlignY=40&desc=Real-time%20Markdown%20workspace&descAlignY=62&animation=fadeIn" alt="Knight Markdown Studio banner" />
</div>

<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Manrope&weight=700&size=20&duration=3000&pause=900&color=0F766E&center=true&vCenter=true&width=920&lines=%E5%AE%9E%E6%97%B6+Markdown+%E7%BC%96%E8%BE%91%E5%B7%A5%E4%BD%9C%E5%8F%B0;Write+in+Markdown.+See+it+instantly.;%E5%A4%A7%E7%BA%B2%E3%80%81%E5%8E%86%E5%8F%B2%E5%BF%AB%E7%85%A7%E3%80%81%E5%AF%BC%E5%87%BA%E4%B8%8E%E4%B8%BB%E9%A2%98%E5%88%87%E6%8D%A2%E5%90%8C%E5%B1%8F%E5%8D%8F%E4%BD%9C" alt="Animated product summary" />
</div>

<p align="center">
  一个完整的 Markdown 工作台：左侧专注源码写作，右侧即时预览排版结果，同时提供大纲导航、历史快照、导出能力、主题切换等能力。
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-111827?logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-111827?logo=typescript&logoColor=3178C6" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Vite-7-111827?logo=vite&logoColor=646CFF" alt="Vite 7" />
  <img src="https://img.shields.io/badge/CodeMirror-6-111827?logo=codemirror&logoColor=F97316" alt="CodeMirror 6" />
  <img src="https://img.shields.io/badge/Markdown--it-GFM-111827?logo=markdown&logoColor=ffffff" alt="Markdown-it GFM" />
</p>

## 项目简介

Knight Markdown Studio 是一个面向长期写作与技术内容整理的单页面 Markdown 编辑器。

它把源码编辑、实时预览、结构导航、草稿恢复、主题切换和导出交付收拢到同一个工作台里，让 Markdown 不只是“能写”，而是更适合持续写作、知识沉淀和技术表达。

适合这些场景：

- 技术文档与接口说明
- 学习笔记与知识库草稿
- 博客初稿与长文写作
- 需要一边写源码、一边看排版结果的 Markdown 工作流

## 核心亮点

- 双栏工作台：左侧源码编辑，右侧即时预览，桌面端与移动端都有合适布局。
- 实时预览：基于 GFM 渲染，支持表格、任务列表、图片、引用、脚注和代码块高亮。
- 长文档友好：支持大纲导航、块级滚动同步、查找替换、历史快照与自动保存。
- 导出完整：支持导入 `.md`、导出 Markdown、复制 HTML、导出独立 HTML，以及 PDF / 打印。
- 产品化体验：支持 `light`、`dark`、`system` 主题，提供字体、预览宽度、代码字体等个性化设置。

## 界面预览

### 工作台总览

应用采用产品化的双栏工作区布局，品牌头部、结构导航、编辑区与预览区在一个界面中协同工作，适合持续写作与技术内容管理。

![Knight Markdown Studio light workspace](./.github/assets/workspace-light.png)

### 主题切换

应用支持 `light`、`dark` 和 `system` 三种主题模式，并会记住用户偏好。浅色主题更适合阅读与整理，深色主题更适合专注写作与技术内容浏览。

| 浅色主题 | 深色主题 |
| --- | --- |
| ![Knight Markdown Studio light theme](./.github/assets/workspace-light.png) | ![Knight Markdown Studio dark theme](./.github/assets/workspace-dark.png) |

### 代码块高亮

<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=18&duration=2600&pause=900&color=22A699&center=true&vCenter=true&width=860&lines=Syntax+highlighting+for+fenced+code+blocks;Readable+code+for+docs%2C+notes%2C+and+API+guides;Inline+code+and+preview+styles+stay+consistent" alt="Code highlighting animation" />
</div>

代码块高亮不仅是“把代码染色”，更重要的是让技术内容在预览区里保持清晰、稳定、可读：

- 支持 fenced code block 与 inline code 的差异化展示
- 代码块高亮风格会与当前主题保持一致
- 更适合技术文档、接口说明、学习笔记和工程博客写作

![Knight Markdown Studio code highlighting preview](./.github/assets/code-highlight-dark.png)

## 功能概览

| 模块 | 能力 |
| --- | --- |
| 编辑 | Markdown 工具栏、快捷键、自动换行、行号开关、查找替换 |
| 导航 | 文档大纲、标题跳转、编辑区与预览区块级同步 |
| 持久化 | 自动保存、草稿恢复、历史快照、重置示例 |
| 导出 | Markdown、独立 HTML、复制 HTML、PDF / 打印 |
| 个性化 | `light` / `dark` / `system`、字体大小、预览宽度、代码字体 |
| 媒体 | `.md` 拖拽导入、图片 URL、图片文件粘贴与预览 |

## 技术栈

- React 19
- TypeScript
- Vite
- CodeMirror 6
- markdown-it
- highlight.js
- DOMPurify
- Vitest + Testing Library

## 本地开发

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

默认本地地址通常为：

```text
http://localhost:5173/
```

### 构建生产版本

```bash
npm run build
```

### 本地预览生产包

```bash
npm run preview
```

## 可用脚本

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
```

## 目录结构

```text
src/
  components/    UI 组件
  hooks/         编辑器、预览、设置与交互 hooks
  lib/           Markdown 渲染、存储、导出、同步与编辑逻辑
  test/          测试辅助与测试配置
  types/         类型定义

public/          静态资源
```

## 质量保障

当前项目已经覆盖这些基础检查：

- `npm run lint`
- `npm run test`
- `npm run build`

## License

本项目基于 [MIT License](./LICENSE) 开源。
