# Design Decisions for willisMD

This document records major design and implementation decisions made during the development of willisMD, along with their rationale and alternatives considered.

## 1. Electron + React Stack
- **Decision**: Use Electron for cross-platform desktop app, React for UI.
- **Rationale**: Electron provides native-like desktop capabilities; React enables modular, maintainable UI.
- **Alternatives**: Native desktop frameworks (e.g., Qt, WPF) were considered but rejected for cross-platform complexity.

## 2. Modular Component Structure
- **Decision**: Organize UI into reusable React components.
- **Rationale**: Improves maintainability, testability, and feature extensibility.

## 3. Preload Script for Security
- **Decision**: Use a preload script to expose safe APIs to the renderer.
- **Rationale**: Follows Electron security best practices, limits direct Node.js access from the renderer.

## 4. Markdown as Core Format
- **Decision**: Use Markdown for all user content and templates.
- **Rationale**: Human-readable, portable, and widely supported.

## 5. IPC for Main/Renderer Communication
- **Decision**: Use IPC for privileged operations (file system, export, preferences).
- **Rationale**: Maintains separation of concerns and security boundaries.

> This document should be updated as new architectural or implementation decisions are made.
