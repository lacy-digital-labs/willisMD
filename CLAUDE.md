# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

willisMD is a markdown editor application with visual markdown editing and automatic preview capabilities using Electron and React. The project has evolved from a basic editor to a sophisticated markdown editing environment with advanced features.

## Current Project Status

The project is actively developed with a fully functional Electron + React application featuring:
- Main process handling file operations and window management
- Renderer process with React components for the UI
- Split-pane editor with live markdown preview
- Tab support for multiple files
- Advanced toolbar and file operations
- CodeMirror 6 advanced editor with full markdown support

## Technology Stack

- **Framework**: Electron 36.4.0
- **UI Library**: React 19.1.0
- **Language**: JavaScript (ES6+)
- **Bundler**: Webpack 5
- **Markdown Parser**: marked 15.0.12
- **Advanced Editor**: CodeMirror 6
- **Platforms**: macOS, Windows, Linux

## Implemented Features

1. ✅ Visual markdown editor with automatic preview
2. ✅ Basic file operations (open, save, save as)
3. ✅ Tab support for multiple files
4. ✅ Toolbar for markdown formatting
5. ✅ Export functionality (HTML, PDF, EPUB, DOCX) with theme support
6. ✅ Template support for new documents
7. ✅ Syntax highlighting in editor
8. ✅ Undo/redo functionality
9. ✅ Auto-save toggle with configurable interval
10. ✅ Preferences/settings window with persistence
11. ✅ Find and replace functionality with regex support
12. ✅ Recent files and folders menu
13. ✅ Themes (light/dark mode + 8 custom themes)
14. ✅ File explorer with proper folder hierarchy
15. ✅ Advanced CodeMirror editor option
16. ✅ Perfect scroll synchronization between editor and preview
17. ✅ Full markdown syntax highlighting
18. ✅ Line numbers and active line highlighting
19. ✅ Code folding and bracket matching
20. ✅ Multiple cursor support
21. ✅ Support for Wiki style links
22. ✅ Word wrap in editor for easier editing of long lines

## Features to Implement

1. Multi-window support
2. Advanced markdown support:
   - Tables (partial support via marked)
   - Task lists
   - Footnotes
   - Math equations (LaTeX)
   - Mermaid diagrams
3. Keyboard shortcuts for all menu actions
5. Auto-completion for markdown syntax
6. Markdown linting


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
│   ├── main.js          # Main Electron process (includes embedded theme CSS)
│   ├── exportUtils.js   # Export functionality (PDF, DOCX, etc.)
│   └── preferences.js   # Preferences window handler
├── preload/
│   └── preload.js       # Preload script for secure IPC
├── renderer/
│   ├── index.js         # Main React application
│   ├── components/
│   │   ├── CodeMirrorEditor.js    # Advanced CodeMirror editor
│   │   ├── AboutDialog.js         # About dialog component
│   │   └── FindReplace.js         # Find and replace functionality
│   ├── MarkdownUtils.js # Markdown processing utilities
│   ├── SyntaxHighlighter.js # Syntax highlighting utilities
│   ├── styles.css       # Main application styles
│   └── themes.css       # Theme definitions
├── shared/
│   └── previewStyles.js # Shared theme styles for preview and export
└── templates/           # Document templates
```

## Architecture Notes

1. **IPC Communication**: The app uses contextBridge in the preload script to expose safe APIs to the renderer process. All file operations go through IPC channels.

2. **State Management**: Currently using React state in index.js. The application manages complex state including tabs, preferences, and editor modes.

3. **Markdown Processing**: Using the `marked` library for markdown parsing with DOMPurify for sanitization.

4. **Advanced Editor System**: 
   - **CodeMirror 6**: Professional text editor with full markdown syntax highlighting, line numbers, code folding, and advanced features
   - **Unified Experience**: All users get the same powerful editing experience

5. **Export Functionality**: 
   - Supports HTML, PDF (via puppeteer), EPUB, and DOCX exports
   - Theme-aware exports: All export formats use the currently selected preview theme
   - Main process override: Exports read theme directly from saved preferences to ensure consistency
   - Embedded theme CSS in main process for production compatibility

6. **Theme System**: 
   - Comprehensive theming with CSS custom properties supporting 10 different themes
   - Themes available: Standard, Modern, Manuscript, Business, Informal, Academic, Technical, Minimalist, Classic, Report
   - Live preview updates when switching themes
   - Theme selection persists across sessions
   - All exports respect selected theme

## Key Dependencies

- **electron**: 36.4.0 - Desktop app framework
- **react**: 19.1.0 - UI framework
- **marked**: 15.0.12 - Markdown parser
- **dompurify**: 3.2.6 - HTML sanitization
- **puppeteer**: 24.10.1 - PDF export
- **html-to-docx**: 1.8.0 - DOCX export
- **webpack**: 5.99.9 - Module bundler
- **babel**: 7.27.x - JavaScript transpiler
- **@codemirror/\***: 6.x - Advanced editor components
- **codemirror**: 6.0.2 - Main CodeMirror package

## CodeMirror Integration

The application features a comprehensive CodeMirror 6 integration:

### Features
- Full markdown syntax highlighting
- Line numbers with active line highlighting
- Code folding for markdown sections
- Bracket matching for links and emphasis
- Multiple cursor support
- Advanced search and replace
- Auto-completion
- Theme integration with app themes
- Perfect scroll synchronization with preview

### Usage
The CodeMirror editor is enabled by default for all users, providing a consistent advanced editing experience.

### Implementation
- **CodeMirrorEditor.js**: Main component with full CodeMirror setup
- **Theme Integration**: Automatic theme switching based on app theme
- **Scroll Sync**: Bidirectional scroll synchronization with preview
- **Content Updates**: Real-time preview updates with proper async handling

## Known Issues & TODOs

1. Tests are not yet configured
2. Keyboard shortcuts only implemented for basic actions (more could be added)
3. Multi-window support not implemented
4. No plugin system for extensibility
5. Some CodeMirror features could be expanded (vim bindings, more extensions)

## Recent Updates (v0.8.7)

### Theme Export Fix
- **Fixed theme selection for exports** - PDF, HTML, EPUB, DOCX exports now correctly use the selected preview theme
- **Implemented main process theme override** - Exports read theme directly from saved preferences to avoid React state synchronization issues
- **Embedded theme CSS in main process** - Resolved module loading errors in production builds
- **Comprehensive theme support** - All export formats now respect the user's selected preview style

### Technical Improvements
- **Webpack configuration fixes** - Resolved `require is not defined` errors in development
- **CSP security improvements** - Removed `unsafe-eval` from Content Security Policy
- **Module architecture** - Created shared directory for common modules between main and renderer processes
- **Production build compatibility** - Fixed .asar packaging issues with dynamic module loading

## Previous Updates (v0.8.3)

- **Enhanced editor experience with word wrap** - Added word wrap functionality to CodeMirror editor for easier editing of long lines
- **Improved editing usability** - Long paragraphs and sentences now wrap naturally in the editor without horizontal scrolling
- **Maintained all existing functionality** - Word wrap addition preserves all existing features and performance

## Earlier Updates (v0.8.2)

- **Fixed External Link Navigation Issue** - Resolved issue with external links not opening properly in default browser

## Earlier Updates (v0.8.0)

- **Fixed file explorer auto-refresh** - All file operations (create, delete, duplicate, save) now automatically refresh the explorer
- **Enhanced context menu functionality** - Right-click operations in file explorer now work properly with custom input dialogs
- **Added VS Code-style toolbar** - File explorer includes toolbar buttons for creating files/folders and refreshing
- **Improved file creation workflow** - Context menu "New File" now creates actual files on disk (not just unsaved tabs)
- **Fixed webpack global variable error** - Resolved "global is not defined" error preventing app startup
- **Enhanced error handling** - All file operations now show proper status messages and error handling
- **Replaced prompt() with custom dialogs** - Professional modal input dialogs for file/folder creation
- **Added comprehensive debug logging** - Better debugging and troubleshooting capabilities

## Previous Updates (v0.7.0)

- **Made CodeMirror the default and only editor** - Simplified the user experience by providing a single, powerful editor
- **Removed basic textarea editor** - All users now get advanced editing features
- **Removed editor toggle** - Streamlined preferences interface
- **Removed toolbar dependencies** - CodeMirror provides its own formatting capabilities
- **Simplified codebase** - Reduced complexity and bundle size

## Earlier Updates (v0.6.x)

- Added CodeMirror 6 integration as optional advanced editor
- Fixed file explorer folder hierarchy display
- Implemented perfect scroll synchronization
- Enhanced theming system for CodeMirror
- Improved content change handling for real-time preview updates
- Added comprehensive editor preferences