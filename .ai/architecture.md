# Architecture Overview for willisMD

This document describes the high-level architecture of the willisMD application, including its main components and their interactions.

## System Overview
willisMD is a desktop application built with Electron and React, designed for Markdown editing and note management. The architecture follows a modular structure, separating concerns between the main process, renderer process, and supporting utilities.

## Main Components

- **Electron Main Process (`src/main/`)**
  - Manages application lifecycle, window creation, and system-level integrations.
  - Handles exporting, preferences, and IPC communication with renderer.

- **Preload Script (`src/preload/`)**
  - Provides a secure bridge between the main and renderer processes.
  - Exposes safe APIs to the renderer.

- **Renderer Process (`src/renderer/`)**
  - Built with React for UI rendering and user interaction.
  - Contains main app logic, Markdown utilities, syntax highlighting, and UI components.

- **Public Assets (`public/`)**
  - Static files, icons, and the HTML entry point.

- **Configuration & Templates**
  - `package.json` for dependencies and scripts.
  - `templates/` for Markdown document templates.

## Data Flow
- User actions in the renderer trigger events handled by React components.
- Renderer communicates with the main process via IPC for privileged operations (e.g., file system, export).
- Preload script ensures secure, controlled access to Node.js APIs.

## Extensibility
- Modular component structure in `src/renderer/components/` allows for easy addition of new features.
- Utility modules encapsulate reusable logic.

> For design decisions and rationale, see design_decisions.md.
