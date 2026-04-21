# Knight Markdown Studio

实时 Markdown 编辑工作台。

Knight Markdown Studio 是一个面向写作者、开发者和内容创作者的单页面 Markdown 编辑器：左侧专注写作，右侧即时渲染，结构、预览、导出、草稿恢复和命令操作都在一个工作台里完成。

它不是只会“写 Markdown”的输入框，而是一套更完整的写作体验：

- 一边输入，一边看到真实排版结果
- 一边组织结构，一边快速跳转和定位
- 一边保存草稿，一边放心修改和回滚
- 一边导出内容，一边保持交付效率

## Product Highlights

- 双栏实时编辑体验
  左侧基于 CodeMirror 的 Markdown 源码编辑区，右侧安全渲染的 GFM 实时预览。

- 更适合长文档的工作流
  支持大纲导航、查找替换、命令面板、历史快照和块级滚动同步，处理结构化内容更轻松。

- 为移动端重新设计过
  手机端支持 `编辑 / 预览 / 分屏` 三态切换，不只是简单把桌面布局压缩到小屏。

- 导入、导出和打印一站完成
  支持导入 `.md`、导出 `.md`、导出独立 `.html`、复制 HTML、PDF/打印。

- 更稳的草稿体系
  自动保存到本地，刷新后自动恢复；还保留最近历史快照，降低误删和误改风险。

- 更顺手的图片体验
  支持拖拽插入图片、粘贴图片 URL、直接粘贴图片文件，并避免把超长 base64 塞满源码区。

## Core Experience

### 1. Write

- 支持 GitHub Flavored Markdown
- 支持标题、粗体、斜体、删除线、列表、任务列表、表格、引用、链接、图片、脚注
- 支持代码块与语法高亮
- 支持常用 Markdown 工具栏和快捷键

### 2. Preview

- 输入后 200ms 内实时更新预览
- 安全渲染 HTML，避免不可信内容直接注入
- 预览支持阅读宽度控制
- 小图片按实际尺寸显示，不会被强行铺满整列

### 3. Navigate

- 自动提取 `# / ## / ###` 生成文档大纲
- 点击大纲可同步跳转到对应内容位置
- 编辑区与预览区支持块级滚动同步
- 长文档写作时更容易保持上下文

### 4. Export

- 导出 Markdown 源文件
- 导出带样式的独立 HTML 文件
- 一键复制 HTML
- PDF / 打印支持

## Feature List

### Editing

- CodeMirror 6 编辑器
- 工具栏插入 Markdown 语法
- 快捷键支持
- 自动换行开关
- 行号开关
- 查找替换
- 命令面板

### Layout

- 桌面端左右拖拽分栏
- 移动端上下布局
- 移动端 `编辑 / 预览 / 分屏` 三态切换
- 专注模式
- 全屏模式

### Writing Support

- 字符数 / 行数统计
- 字数目标
- 草稿自动保存
- 草稿恢复
- 历史快照回滚
- 文档大纲高亮

### Media & Files

- 导入 `.md`
- 拖拽导入 Markdown 文件
- 拖拽插入图片
- 粘贴图片 URL
- 粘贴图片文件

### Theme & Preferences

- 浅色 / 深色 / 跟随系统
- 字体大小调节
- 预览宽度调节
- 代码字体切换
- 移动端默认视图偏好记忆

## Tech Stack

- React 19
- TypeScript
- Vite
- CodeMirror 6
- markdown-it
- highlight.js
- DOMPurify
- Vitest + Testing Library

## Local Development

### Install

```bash
npm install
```

### Start Dev Server

```bash
npm run dev
```

默认开发地址通常是：

```text
http://localhost:5173/
```

### Build Production Assets

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Available Scripts

```bash
npm run dev      # 启动开发环境
npm run build    # 构建生产版本
npm run preview  # 本地预览生产包
npm run lint     # 代码规范检查
npm run test     # 运行测试
```

## Project Structure

```text
src/
  components/    UI 组件
  hooks/         编辑器、预览、偏好设置等 hooks
  lib/           Markdown 渲染、存储、导出、编辑逻辑
  types/         类型定义
```

## Why This Project

很多 Markdown 编辑器只解决“输入”这一个动作，但真实写作往往是四件事同时发生：

1. 写内容
2. 看结构
3. 调排版
4. 防止丢稿

Knight Markdown Studio 想把这四件事放进同一个干净、现代、可持续扩展的工作台里。

## Quality

当前项目已经覆盖以下工程保障：

- `lint` 代码规范检查
- `test` 核心行为测试
- `build` 生产构建验证

## Roadmap

- 更完整的 Markdown 资源导出策略
- 更细的生产包体积优化
- 可选的在线部署与分享能力
- 更丰富的写作模板与内容工作流

## License

当前仓库默认按代码仓库方式公开。如需补充正式开源协议，可在后续添加 `LICENSE` 文件。

---

Copyright © 2026 Knight | 贺. All Rights Reserved.
