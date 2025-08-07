# Best Practices for willisMD

This document outlines standards and conventions for code, architecture, and testing in the willisMD project.

## Coding
- Use ES6+ JavaScript syntax and features.
- Prefer functional React components and hooks.
- Maintain clear, descriptive variable and function names.
- Keep functions and components small and focused.

## Architecture
- Organize code by feature and responsibility (main, preload, renderer, components).
- Encapsulate reusable logic in utility modules.
- Use IPC for main/renderer communication.

## Testing
- Write unit tests for all core logic and UI components.
- Use mocks and fixtures for external dependencies.
- Follow Arrange-Act-Assert pattern in tests.
- Maintain high code coverage, especially for critical features.

## Documentation
- Update documentation as features evolve.
- Use Markdown for all docs and templates.

> Adhering to these practices ensures maintainability, testability, and ease of onboarding.
