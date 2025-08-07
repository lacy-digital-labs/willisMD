# Test Strategy for willisMD

This document outlines the approach, tools, and philosophy for testing the willisMD application.

## Testing Approach
- **Unit Testing**: Focus on core logic, utility functions, and React components.
- **Integration Testing**: Validate interactions between main and renderer processes, and between UI components.
- **Manual Testing**: Used for Electron-specific features and platform integration.

## Tools
- **Recommended**: Jest (unit/integration), React Testing Library (UI), Spectron (Electron integration)
- **Coverage**: Aim for >80% code coverage on core logic and UI components.

## Test Organization
- Place unit and integration tests alongside source files or in a dedicated `test/` directory.
- Use mock data and fixtures for repeatable tests.

## Continuous Integration
- Integrate tests into CI/CD pipeline via GitHub Actions.

## Philosophy
- Prioritize tests for critical features (Markdown parsing, file operations, export).
- Write clear, maintainable, and isolated tests.

> For detailed guidelines, see unit_test_guidelines.md.
