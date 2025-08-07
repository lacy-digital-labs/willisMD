# Module Index for willisMD

This document maps the key source files and their roles within the willisMD project. It is intended to provide a high-level overview of the codebase structure for onboarding, automated reasoning, and code generation.

| Module/File                          | Description                                                      |
|--------------------------------------|------------------------------------------------------------------|
| src/main/main.js                     | Electron main process entry point, app lifecycle management      |
| src/main/exportUtils.js              | Utilities for exporting data                                     |
| src/main/preferences.js              | Manages user preferences and settings                            |
| src/preload/preload.js               | Preload script for Electron renderer process security            |
| src/renderer/App.js                  | Main React component, application root                           |
| src/renderer/index.js                | Entry point for renderer process                                 |
| src/renderer/MarkdownUtils.js        | Markdown parsing and utility functions                           |
| src/renderer/SyntaxHighlighter.js    | Syntax highlighting for code blocks                              |
| src/renderer/components/             | UI components (Editor, Toolbar, Preview, etc.)                   |
| src/renderer/styles/                 | CSS stylesheets for renderer UI                                  |
| public/index.html                    | HTML entry point for Electron renderer                           |
| package.json                         | Project configuration and dependencies                           |

> For a more detailed breakdown, see architecture.md and design_decisions.md.
