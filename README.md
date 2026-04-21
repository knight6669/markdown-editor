<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=240&color=0:0f766e,100:7dd3fc&text=Knight%20Markdown%20Studio&fontColor=ffffff&fontAlignY=40&desc=Real-time%20Markdown%20workspace&descAlignY=62&animation=fadeIn" alt="Knight Markdown Studio banner" />
</div>

<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Manrope&weight=700&size=20&duration=3000&pause=900&color=0F766E&center=true&vCenter=true&width=820&lines=Write+in+Markdown.+See+it+instantly.;Outline%2C+history%2C+export%2C+and+theme+control+in+one+workspace.;Built+for+long-form+writing%2C+notes%2C+docs%2C+and+developer+content." alt="Animated product summary" />
</div>

<p align="center">
  A polished single-page Markdown editor built for people who want more than a plain textarea:
  live preview, outline navigation, snapshot history, export tools, theme switching, and a product-grade writing surface.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-111827?logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6-111827?logo=typescript&logoColor=3178C6" alt="TypeScript 6" />
  <img src="https://img.shields.io/badge/Vite-8-111827?logo=vite&logoColor=646CFF" alt="Vite 8" />
  <img src="https://img.shields.io/badge/CodeMirror-6-111827?logo=codemirror&logoColor=F97316" alt="CodeMirror 6" />
  <img src="https://img.shields.io/badge/Markdown--it-GFM-111827?logo=markdown&logoColor=ffffff" alt="Markdown-it GFM" />
</p>

## What It Is

Knight Markdown Studio is a real-time Markdown workspace designed to feel like a product, not a demo.

It combines:

- a focused source editor on the left
- a fast rendered preview on the right
- structure tools for long documents
- export and print workflows for delivery
- draft persistence so work is never far from recovery

The goal is simple: keep writing, structure, preview, and output in the same calm interface.

## UI Preview

### Desktop Workspace

The main workspace is designed to be screenshot-ready: balanced spacing, restrained chrome, modern surfaces, and a split layout that feels like a real writing product.

![Light workspace](./docs/assets/workspace-light.png)

### Theme Switching

Light mode and dark mode are both first-class views. The app supports `light`, `dark`, and `system` theme modes, and remembers the user's preference across sessions.

| Light Theme | Dark Theme |
| --- | --- |
| ![Light theme workspace](./docs/assets/workspace-light.png) | ![Dark theme workspace](./docs/assets/workspace-dark.png) |

### Preview and Code Highlighting

Rendered Markdown includes highlighted code blocks, readable content rhythm, and a presentation layer suitable for export.

![Dark preview with code highlighting](./docs/assets/preview-dark.png)

## Product Highlights

### Real-Time Markdown Editing

- Write in Markdown and see the formatted result update in real time
- Debounced preview updates keep the UI responsive
- GitHub Flavored Markdown support for headings, emphasis, lists, tasks, tables, links, images, quotes, and footnotes

### Product-Grade Writing Surface

- Modern top bar with branded product treatment
- Resizable split layout on desktop
- Mobile `editor / preview / split` modes
- Focus mode and fullscreen mode for distraction control

### Theme System

- Light theme
- Dark theme
- Follow-system theme mode
- Adjustable font size
- Adjustable preview width
- Switchable code font preferences

### Code-Friendly Markdown Experience

- CodeMirror 6 editing engine
- Toolbar actions for common Markdown syntax
- Keyboard shortcuts for fast formatting
- Syntax highlighting inside rendered code blocks
- Cleaner pasted-image handling without dumping giant base64 blobs into the source view

### Built for Longer Documents

- Auto-generated outline from `#`, `##`, and `###`
- Click-to-jump outline navigation
- Block-level scroll sync between source and preview
- Find and replace
- Command palette for common actions
- Character count, line count, and word-goal tracking

### Draft Safety

- Autosave to local storage
- Restore the latest draft after refresh
- Snapshot history for recent recovery points
- Reset and restore controls for fast iteration

### Import, Export, and Delivery

- Import `.md`
- Export raw Markdown
- Export standalone HTML with styling
- Copy rendered HTML
- Print / PDF workflow

## Feature Summary

| Area | What it covers |
| --- | --- |
| Editing | Markdown toolbar, shortcuts, line wrapping, line numbers, find/replace |
| Navigation | Outline panel, jump-to-heading, block sync |
| Presentation | Light/dark themes, preview width control, polished preview styling |
| Media | Drag-and-drop images, paste image URLs, paste image files |
| Output | Markdown export, HTML export, copy HTML, PDF/print |
| Recovery | Autosave, draft restore, snapshot history |

## Tech Stack

- React 19
- TypeScript
- Vite
- CodeMirror 6
- markdown-it
- highlight.js
- DOMPurify
- Vitest and Testing Library

## Local Development

### Install

```bash
npm install
```

### Run the dev server

```bash
npm run dev
```

Typical local address:

```text
http://localhost:5173/
```

### Build the production bundle

```bash
npm run build
```

### Preview the production build locally

```bash
npm run preview
```

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
```

## Repository Structure

```text
src/
  components/    UI building blocks
  hooks/         editor, preview, fullscreen, media query, preferences
  lib/           markdown rendering, storage, export, sync, transforms
  types/         shared editor and markdown types

docs/assets/     README screenshots
```

## Why This Project Exists

Many Markdown editors solve only one thing: typing.

Real writing usually needs four things at once:

1. write
2. structure
3. preview
4. recover

Knight Markdown Studio is built to keep all four in one deliberate workspace.

## Quality Checks

The project is already wired for:

- `npm run lint`
- `npm run test`
- `npm run build`

## Roadmap

- richer Markdown asset export workflows
- additional package-size optimization
- optional hosted deployment path
- more writing templates and publishing-oriented flows

## License

This repository is currently published as a public codebase. A dedicated `LICENSE` file can be added later if a formal open-source license is needed.

---

Copyright © 2026 Knight | He. All Rights Reserved.
