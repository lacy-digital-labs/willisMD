# willisMD

A cross-platform markdown editor with live preview, built with Electron and React.

## Overview of App

willisMD is a visual markdown editor designed for simplicity and productivity. It provides real-time preview of your markdown content and supports advanced markdown features while maintaining an intuitive user interface.

## Core Features

### Editor Capabilities
- **Split-pane view**: Side-by-side markdown source and live preview
- **Syntax highlighting**: Color-coded markdown syntax in the editor
- **Real-time preview**: Instant rendering as you type
- **Line numbers**: Optional line numbering in the editor
- **Word wrap**: Toggle between wrapped and unwrapped text

### File Management
- **Create**: New markdown files with templates (blank, blog post, documentation)
- **Open**: Support for .md, .markdown, and .txt files
- **Save**: Save and Save As functionality with keyboard shortcuts
- **Recent files**: Quick access to recently opened documents
- **Auto-save**: Configurable auto-save with customizable intervals

### Multi-Document Support
- **Tabbed interface**: Open multiple files in tabs
- **Multi-window**: Open documents in separate windows
- **Tab management**: Drag to reorder, close buttons, unsaved indicators
- **Window synchronization**: Option to sync scroll position across windows

### Advanced Markdown Support
- **CommonMark compliant**: Full support for standard markdown
- **Tables**: GitHub-flavored markdown tables with alignment
- **Task lists**: Interactive checkboxes
- **Code blocks**: Syntax highlighting for multiple languages
- **Footnotes**: Support for reference-style footnotes
- **Hyperlinks**: Click to open in browser, hover to preview
- **Math equations**: LaTeX math rendering (inline and block)
- **Mermaid diagrams**: Support for flowcharts and diagrams

### Editing Features
- **Undo/Redo**: Multi-level undo with keyboard shortcuts
- **Find and Replace**: Search within document with regex support
- **Auto-completion**: Smart suggestions for markdown syntax
- **Bracket matching**: Highlight matching brackets and markdown pairs
- **Toolbar**: Quick access buttons for common formatting

### User Experience
- **Themes**: Light and dark modes with custom theme support
- **Customizable preview**: CSS customization for preview pane
- **Export options**: Export to HTML, PDF, or plain text
- **Print support**: Print markdown or rendered preview
- **Keyboard shortcuts**: Comprehensive keyboard navigation

## Technical Requirements

### Platform Support
- macOS 10.14+
- Windows 10+
- Linux (Ubuntu 18.04+, Fedora 32+)

### Technology Stack
- **Framework**: Electron (latest stable)
- **UI Library**: React 18+
- **Markdown Parser**: markdown-it or remark
- **Code Editor**: Monaco Editor or CodeMirror
- **State Management**: React Context API or Zustand
- **File System**: Node.js fs module with proper sandboxing

### Performance Goals
- Startup time: < 2 seconds
- File open: < 500ms for files up to 1MB
- Typing latency: < 50ms
- Preview update: < 100ms

## Future Enhancements (Post-MVP)
- Plugin system for extensibility
- Cloud synchronization
- Collaborative editing
- Version control integration
- Mobile companion app
- Voice dictation support
- AI-powered writing assistance

## Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/willisMD.git
cd willisMD

# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

## License

[To be determined]