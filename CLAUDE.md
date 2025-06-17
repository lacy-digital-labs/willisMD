# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

willisMD is a markdown editor application currently in the planning phase. The project aims to create a visual markdown editor with automatic preview capabilities using Electron and React.

## Current Project Status

**IMPORTANT**: This project is not yet initialized. As of now, only the README.md exists with the project vision. Before any development work, the project needs to be properly initialized.

## Planned Technology Stack

- **Framework**: Electron (for cross-platform desktop app)
- **UI Library**: React
- **Language**: JavaScript/TypeScript (to be determined)
- **Platforms**: macOS, Windows, Linux

## Key Features to Implement

1. Visual markdown editor with automatic preview
2. Basic file operations (create, open, save)
3. Multi-window support
4. Tab support for multiple files
5. Advanced markdown support:
   - Tables
   - Hyperlinks
   - Footnotes
6. Undo/redo functionality
7. Auto-save toggle

## Development Commands

The project is now initialized with a basic Electron + React structure. Use these commands:

- `npm start` - Run the application in development mode
- `npm run dev` - Same as npm start
- `npm run build` - Build the application for production
- `npm run build:renderer` - Build only the React app
- `npm run build:electron` - Package the Electron app
- `npm test` - Run tests (test framework not yet configured)

## Architecture Considerations

When implementing this project, consider:

1. **Main Process vs Renderer Process**: Electron apps have a main process (Node.js) and renderer processes (web pages). File operations should be handled in the main process.

2. **IPC Communication**: Use Electron's IPC (Inter-Process Communication) for communication between main and renderer processes.

3. **State Management**: Consider using React Context or a state management library for handling multiple windows and tabs.

4. **Markdown Processing**: You'll need a markdown parser/renderer library (e.g., marked, markdown-it).

5. **Editor Component**: Consider using or building upon existing React markdown editor components.