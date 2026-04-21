# Knight Markdown Studio

一个单页面 Web Markdown 编辑器，支持源码编辑、实时预览、Markdown 工具栏、快捷键、文件导入导出、自动保存草稿与现代化响应式界面。

## 功能

- 左侧 CodeMirror 编辑区，右侧安全渲染的 GFM 预览
- 桌面端左右拖拽分栏，移动端上下拖拽布局
- 工具栏插入标题、列表、链接、图片、代码块、表格、引用等常用语法
- `Ctrl/Cmd + B`、`Ctrl/Cmd + I`、`Ctrl/Cmd + K`、`Ctrl/Cmd + Shift + C`、`Ctrl/Cmd + Shift + 7`
- 导入 `.md`、导出 `.md`、导出带样式的独立 `.html`
- 每 30 秒自动保存到 `localStorage`，刷新后自动恢复草稿
- 字符数、行数、保存状态展示

## 开发

```bash
npm install
npm run dev
```

## 校验

```bash
npm run lint
npm run build
```
