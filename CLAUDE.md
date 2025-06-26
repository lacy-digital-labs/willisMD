# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

willisMD is a markdown editor application currently in the planning phase. The project aims to create a visual markdown editor with automatic preview capabilities using Electron and React.

## Current Project Status

The project has been initialized with a working Electron + React application. The basic structure is in place with:
- Main process handling file operations and window management
- Renderer process with React components for the UI
- Split-pane editor with live markdown preview
- Tab support for multiple files
- Basic toolbar and file operations

## Technology Stack

- **Framework**: Electron 36.4.0
- **UI Library**: React 19.1.0
- **Language**: JavaScript (ES6+)
- **Bundler**: Webpack 5
- **Markdown Parser**: marked 15.0.12
- **Platforms**: macOS, Windows, Linux

## Implemented Features

1. ✅ Visual markdown editor with automatic preview
2. ✅ Basic file operations (open, save, save as)
3. ✅ Tab support for multiple files
4. ✅ Toolbar for markdown formatting
5. ✅ Export functionality (HTML, PDF, DOCX)
6. ✅ Template support for new documents
7. ✅ Syntax highlighting in editor
8. ✅ Undo/redo functionality
9. ✅ Auto-save toggle with configurable interval
10. ✅ Preferences/settings window with persistence
11. ✅ Find and replace functionality with regex support
12. ✅ Recent files and folders menu
13. ✅ Themes (light/dark mode)

## Features to Implement

1. Multi-window support
2. Advanced markdown support:
   - Tables (partial support via marked)
   - Task lists
   - Footnotes
   - Math equations (LaTeX)
   - Mermaid diagrams
3. Plugin system for extensibility
4. Keyboard shortcuts for all menu actions
2. Implement live markdown preview in editor (inline)
3. Add autocompletion for markdown syntax
4. Add bracket matching for markdown links
5. Implement code block syntax highlighting
1. Add vim/emacs keybindings option
3. Add markdown linting
4. Custom themes matching app themes


## Development Commands

- `npm start` or `npm run dev` - Run the application in development mode (starts both webpack dev server and Electron)
- `npm run dev:renderer` - Run only the React development server
- `npm run dev:electron` - Run only the Electron app
- `npm run build` - Build the application for production (both renderer and Electron)
- `npm run build:renderer` - Build only the React app
- `npm run build:electron` - Package the Electron app with electron-builder
- `npm test` - Run tests (test framework not yet configured)

## Project Structure

```
src/
├── main/
│   ├── main.js          # Main Electron process
│   ├── exportUtils.js   # Export functionality (PDF, DOCX, etc.)
│   └── preferences.js   # Preferences window handler
├── preload/
│   └── preload.js       # Preload script for secure IPC
├── renderer/
│   ├── App.js           # Main React component
│   ├── components/
│   │   ├── Editor.js    # Markdown editor component
│   │   ├── Preview.js   # Preview pane component
│   │   ├── TabBar.js    # Tab management component
│   │   └── Toolbar.js   # Formatting toolbar
│   ├── MarkdownUtils.js # Markdown processing utilities
│   └── styles/          # CSS files
└── templates/           # Document templates
```

## Architecture Notes

1. **IPC Communication**: The app uses contextBridge in the preload script to expose safe APIs to the renderer process. All file operations go through IPC channels.

2. **State Management**: Currently using React state in App.js. Consider migrating to Context API or Zustand for more complex state management.

3. **Markdown Processing**: Using the `marked` library for markdown parsing with DOMPurify for sanitization.

4. **Editor**: Currently using a basic textarea. Consider upgrading to CodeMirror or Monaco Editor for better features.

5. **Export Functionality**: Supports HTML, PDF (via puppeteer), and DOCX (via html-to-docx) exports.

## Key Dependencies

- **electron**: 36.4.0 - Desktop app framework
- **react**: 19.1.0 - UI framework
- **marked**: 15.0.12 - Markdown parser
- **dompurify**: 3.2.6 - HTML sanitization
- **puppeteer**: 24.10.1 - PDF export
- **html-to-docx**: 1.8.0 - DOCX export
- **webpack**: 5.99.9 - Module bundler
- **babel**: 7.27.x - JavaScript transpiler

## Known Issues & TODOs

1. Tests are not yet configured
2. The editor is a basic textarea - could benefit from CodeMirror or Monaco Editor for advanced features
3. Keyboard shortcuts only implemented for basic actions (more could be added)
4. Multi-window support not implemented
5. No plugin system for extensibility