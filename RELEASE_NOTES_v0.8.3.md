# willisMD v0.8.3 Release Notes

## Enhanced Editor Experience with Word Wrap

This release focuses on improving the editing experience with word wrap functionality for better handling of long lines in the editor.

### ✨ New Features

- **Word Wrap in CodeMirror Editor**: Long lines now wrap naturally in the editor, eliminating the need for horizontal scrolling when editing lengthy paragraphs or sentences
- **Improved Writing Experience**: Makes prose writing and long-form content much more comfortable to edit

### 🔧 Technical Improvements

- Added `EditorView.lineWrapping` extension to CodeMirror configuration
- Maintains all existing editor functionality while adding word wrap capability
- No performance impact on existing features

### 🐛 Bug Fixes

- Ensured word wrap integration doesn't interfere with other CodeMirror features
- Maintained compatibility with all existing themes and editor preferences

### 📝 What's Included

This release includes all features from previous versions:
- Visual markdown editor with live preview
- File explorer with full file management
- Export functionality (HTML, PDF, DOCX)
- Multiple themes (10 total including light/dark modes)
- Advanced CodeMirror editor with syntax highlighting
- Find and replace with regex support
- Auto-save functionality
- Wiki-style link support
- Perfect scroll synchronization between editor and preview

### 🔄 Migration

No migration required. Simply replace your existing willisMD installation with this version.

### 📁 Download

Available for:
- macOS (Apple Silicon and Intel)
- Windows 
- Linux

---

**Note**: This release maintains full backward compatibility with all existing features while adding the convenience of word wrap for improved editing experience.