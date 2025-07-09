# Contributing to willisMD

Thank you for your interest in contributing to willisMD! We welcome contributions from the community and are grateful for any help you can provide.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Accept feedback gracefully
- Prioritize the community's best interests

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/willisMD.git
   cd willisMD
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/lacy-digital-labs/willisMD.git
   ```
4. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## How to Contribute

### Types of Contributions

- **Bug Fixes**: Fix issues reported in GitHub Issues
- **Features**: Implement new features or enhance existing ones
- **Documentation**: Improve README, add tutorials, or fix typos
- **Themes**: Create new color themes for the editor
- **Translations**: Help translate the app to other languages
- **Tests**: Add test coverage for existing code
- **Performance**: Optimize code for better performance

### First-Time Contributors

Look for issues labeled `good first issue` or `help wanted`. These are great starting points for new contributors.

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- Git

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development environment:
   ```bash
   npm run dev
   ```

3. The app will open automatically with hot-reload enabled.

### Available Scripts

- `npm run dev` - Start development mode
- `npm run build` - Build for production
- `npm run build:renderer` - Build only the React app
- `npm run build:electron` - Package the Electron app
- `npm test` - Run tests (when configured)

## Project Structure

```
willisMD/
├── src/
│   ├── main/              # Main Electron process
│   │   ├── main.js        # Entry point
│   │   ├── exportUtils.js # Export functionality
│   │   └── preferences.js # Settings management
│   ├── preload/           # Preload scripts
│   │   └── preload.js     # IPC bridge
│   └── renderer/          # React application
│       ├── index.js       # React entry point
│       ├── components/    # React components
│       └── styles.css     # Styles
├── public/                # Static assets
├── templates/             # Document templates
└── docs/                  # Documentation
```

## Coding Standards

### JavaScript Style Guide

- Use ES6+ features
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Use async/await over callbacks

### Code Formatting

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Maximum line length: 120 characters

Example:
```javascript
// Good
async function loadFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    console.error('Failed to load file:', error);
    return { success: false, error: error.message };
  }
}
```

### React Guidelines

- Use functional components with hooks
- Keep components small and reusable
- Use meaningful prop names
- Add PropTypes or TypeScript types (future)

### Electron Guidelines

- Always use contextBridge for IPC
- Never expose Node.js APIs directly to renderer
- Handle errors gracefully
- Add appropriate security headers

## Testing

Currently, the project doesn't have a test suite configured. We welcome contributions to set up testing infrastructure using:
- Jest for unit tests
- React Testing Library for component tests
- Spectron or Playwright for E2E tests

## Submitting Changes

### Pull Request Process

1. Update your fork with the latest upstream changes:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. Rebase your feature branch:
   ```bash
   git checkout feature/your-feature-name
   git rebase main
   ```

3. Push your changes:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request on GitHub

### Pull Request Guidelines

- **Title**: Use a clear, descriptive title
- **Description**: Explain what changes you made and why
- **Screenshots**: Include screenshots for UI changes
- **Testing**: Describe how you tested your changes
- **Issues**: Reference any related issues (e.g., "Fixes #123")

### Example PR Description

```markdown
## Description
This PR adds a new "Export to Markdown" feature that allows users to export their documents as plain markdown files.

## Changes
- Added new menu item under File > Export > Markdown
- Implemented export logic in exportUtils.js
- Added keyboard shortcut (Cmd/Ctrl+Shift+M)

## Testing
- Tested on macOS, Windows, and Linux
- Verified exported files maintain formatting
- Tested with various markdown elements

## Screenshots
[Include relevant screenshots]

Fixes #45
```

## Reporting Issues

### Before Reporting

1. Check if the issue already exists
2. Try the latest version
3. Clear your preferences/cache
4. Search closed issues

### Issue Template

When creating an issue, include:
- **Environment**: OS, willisMD version, Node version
- **Description**: Clear description of the problem
- **Steps to Reproduce**: Detailed steps to reproduce
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable
- **Error Messages**: Any console errors

## Feature Requests

We love hearing your ideas! When requesting a feature:

1. Check if it's already requested
2. Explain the use case
3. Describe the proposed solution
4. Consider alternatives
5. Add mockups if possible

## Documentation

### Areas Needing Documentation

- User guides and tutorials
- API documentation
- Theme creation guide
- Plugin system (future)
- Keyboard shortcuts reference

### Writing Documentation

- Use clear, simple language
- Include code examples
- Add screenshots where helpful
- Keep it up-to-date
- Test all examples

## Community

### Getting Help

- Open an issue for bugs
- Start a discussion for questions
- Check existing documentation
- Ask in discussions before opening issues

### Staying Updated

- Watch the repository for updates
- Follow the releases page
- Join discussions
- Subscribe to issues you're interested in

## Recognition

Contributors will be recognized in:
- The project README
- Release notes
- Special thanks section

## License

By contributing to willisMD, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to willisMD! Your efforts help make this project better for everyone. 🎉