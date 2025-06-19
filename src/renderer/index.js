import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { marked } from 'marked';
import { highlightMarkdown } from './SyntaxHighlighter';
import * as MarkdownUtils from './MarkdownUtils';
import AboutDialog from './components/AboutDialog';
import FindReplace from './components/FindReplace';
import './styles.css';
import './themes.css';

// Enhanced Editor Component with undo/redo support and scroll sync
function Editor({ content, onChange, onScroll, scrollToPercentage, onFormat, onShowFindReplace, editorRef, isFindReplaceOpen }) {
  const textareaRef = useRef(null);
  
  // Expose textarea ref to parent
  useEffect(() => {
    if (editorRef) {
      editorRef.current = textareaRef.current;
    }
  }, [editorRef]);
  
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Handle keyboard shortcuts
    const handleKeyDown = (e) => {
      // Cmd/Ctrl+Z for undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        // Let the browser handle native undo
        return;
      }
      
      // Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y for redo
      if ((e.metaKey || e.ctrlKey) && (
        (e.key === 'z' && e.shiftKey) || 
        (e.key === 'y' && !e.shiftKey)
      )) {
        // Let the browser handle native redo
        return;
      }
      
      // Formatting shortcuts
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            handleFormat('bold');
            break;
          case 'i':
            e.preventDefault();
            handleFormat('italic');
            break;
          case 'k':
            e.preventDefault();
            handleFormat('link');
            break;
          case 'f':
            if (!isFindReplaceOpen) {
              e.preventDefault();
              onShowFindReplace && onShowFindReplace(false); // Show find only
            }
            break;
          case 'h':
            if ((e.metaKey || e.ctrlKey) && !isFindReplaceOpen) {
              e.preventDefault();
              onShowFindReplace && onShowFindReplace(true); // Show find and replace
            }
            break;
          default:
            break;
        }
      }
    };
    
    textarea.addEventListener('keydown', handleKeyDown);
    
    return () => {
      textarea.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Handle external scroll requests (from preview)
  useEffect(() => {
    if (scrollToPercentage !== null && textareaRef.current) {
      const element = textareaRef.current;
      const scrollTop = scrollToPercentage * (element.scrollHeight - element.clientHeight);
      element.scrollTop = scrollTop;
    }
  }, [scrollToPercentage]);
  
  const handleScrollEvent = (e) => {
    if (onScroll) {
      const element = e.target;
      const scrollPercentage = element.scrollTop / (element.scrollHeight - element.clientHeight);
      onScroll(scrollPercentage, 'editor');
    }
  };
  
  // Handle formatting from toolbar or keyboard shortcuts
  const handleFormat = (action, ...args) => {
    console.log('Editor handleFormat called with action:', action, 'args:', args);
    const textarea = textareaRef.current;
    if (!textarea) {
      console.log('No textarea ref available');
      return;
    }
    
    let result;
    
    switch (action) {
      case 'bold':
        result = MarkdownUtils.formatBold(textarea);
        break;
      case 'italic':
        result = MarkdownUtils.formatItalic(textarea);
        break;
      case 'strikethrough':
        result = MarkdownUtils.formatStrikethrough(textarea);
        break;
      case 'code':
        result = MarkdownUtils.formatCode(textarea);
        break;
      case 'codeblock':
        result = MarkdownUtils.formatCodeBlock(textarea);
        break;
      case 'h1':
        result = MarkdownUtils.formatH1(textarea);
        break;
      case 'h2':
        result = MarkdownUtils.formatH2(textarea);
        break;
      case 'h3':
        result = MarkdownUtils.formatH3(textarea);
        break;
      case 'ul':
        result = MarkdownUtils.formatUnorderedList(textarea);
        break;
      case 'ol':
        result = MarkdownUtils.formatOrderedList(textarea);
        break;
      case 'quote':
        result = MarkdownUtils.formatQuote(textarea);
        break;
      case 'link':
        result = MarkdownUtils.formatLink(textarea);
        break;
      case 'image':
        result = MarkdownUtils.formatImage(textarea);
        break;
      case 'table':
        result = MarkdownUtils.formatTable(textarea);
        break;
      case 'insert-table':
        result = MarkdownUtils.insertTable(textarea, 3, 3);
        break;
      case 'insert-table-size':
        // Extract rows and cols from additional arguments
        const rows = args[0] || 3;
        const cols = args[1] || 3;
        result = MarkdownUtils.insertTable(textarea, rows, cols);
        break;
      case 'table-add-row-after':
        result = MarkdownUtils.addTableRow(textarea, 'after');
        break;
      case 'table-add-row-before':
        result = MarkdownUtils.addTableRow(textarea, 'before');
        break;
      case 'table-delete-row':
        result = MarkdownUtils.deleteTableRow(textarea);
        break;
      case 'table-add-column-after':
        result = MarkdownUtils.addTableColumn(textarea, 'after');
        break;
      case 'table-add-column-before':
        result = MarkdownUtils.addTableColumn(textarea, 'before');
        break;
      case 'table-delete-column':
        result = MarkdownUtils.deleteTableColumn(textarea);
        break;
      case 'table-align-left':
        result = MarkdownUtils.setColumnAlignment(textarea, 'left');
        break;
      case 'table-align-center':
        result = MarkdownUtils.setColumnAlignment(textarea, 'center');
        break;
      case 'table-align-right':
        result = MarkdownUtils.setColumnAlignment(textarea, 'right');
        break;
      case 'hr':
        result = MarkdownUtils.formatHorizontalRule(textarea);
        break;
      default:
        return;
    }
    
    console.log('Format result:', result);
    if (result) {
      console.log('Updating content with:', result.content.substring(0, 100), '...');
      
      // Get the current state
      const originalValue = textarea.value;
      const originalStart = textarea.selectionStart;
      const originalEnd = textarea.selectionEnd;
      
      // Focus the textarea only if find/replace is not open
      if (!isFindReplaceOpen) {
        textarea.focus();
      }
      
      // Method 1: Try to use execCommand for simple selection replacements
      if (originalStart !== originalEnd || action === 'bold' || action === 'italic' || 
          action === 'strikethrough' || action === 'code' || action === 'link' || action === 'image') {
        
        // Calculate what text to insert
        const beforeSelection = originalValue.substring(0, originalStart);
        const afterSelection = originalValue.substring(originalEnd);
        const newContent = result.content;
        
        // Find what was actually inserted
        if (newContent.startsWith(beforeSelection) && newContent.endsWith(afterSelection)) {
          const insertedText = newContent.substring(beforeSelection.length, newContent.length - afterSelection.length);
          
          // Select the original range
          textarea.setSelectionRange(originalStart, originalEnd);
          
          // Use execCommand to replace selection
          if (document.execCommand('insertText', false, insertedText)) {
            // Success! The undo stack is preserved
            console.log('Successfully used execCommand for undo/redo support');
          } else {
            // Fallback
            textarea.value = result.content;
            onChange(result.content);
          }
        } else {
          // For complex operations, use the fallback
          textarea.value = result.content;
          onChange(result.content);
        }
      } else {
        // For operations that modify the whole line or document structure
        textarea.value = result.content;
        onChange(result.content);
      }
      
      // Set cursor position after React updates
      setTimeout(() => {
        textarea.setSelectionRange(result.cursorPos, result.cursorPos);
        if (!isFindReplaceOpen) {
          textarea.focus();
        }
      }, 0);
    } else {
      console.log('No result from formatting function');
    }
  };
  
  // Expose format handler to parent
  useEffect(() => {
    console.log('Editor: Setting up format handler', typeof onFormat);
    if (onFormat && typeof onFormat === 'function') {
      console.log('Editor: Calling onFormat with handler');
      onFormat(handleFormat);
    }
  }, [onFormat]);
  
  return React.createElement('textarea', {
    ref: textareaRef,
    className: 'editor',
    style: {
      width: '100%',
      height: '100%',
      padding: '15px',
      border: 'none',
      outline: 'none',
      fontFamily: 'Monaco, "SF Mono", Consolas, monospace',
      fontSize: '14px',
      lineHeight: '1.6',
      resize: 'none',
      backgroundColor: 'var(--editor-bg)',
      color: 'var(--editor-text)',
      boxSizing: 'border-box',
      minWidth: 0 // Prevent flex shrinking issues
    },
    value: content || '',
    onChange: (e) => onChange(e.target.value),
    onScroll: handleScrollEvent,
    placeholder: 'Start typing your markdown here...',
    spellCheck: false
  });
}

// Preview Component with scroll sync support
function Preview({ content, onScroll, scrollToPercentage }) {
  const previewRef = useRef(null);
  
  const renderMarkdown = (markdown) => {
    if (!markdown) return 'Preview will appear here...';
    try {
      return marked(markdown);
    } catch (error) {
      console.error('Markdown rendering error:', error);
      return 'Error rendering markdown...';
    }
  };
  
  // Handle external scroll requests (from editor)
  useEffect(() => {
    if (scrollToPercentage !== null && previewRef.current) {
      const element = previewRef.current;
      const scrollTop = scrollToPercentage * (element.scrollHeight - element.clientHeight);
      element.scrollTop = scrollTop;
    }
  }, [scrollToPercentage]);
  
  const handleScrollEvent = (e) => {
    if (onScroll) {
      const element = e.target;
      const scrollPercentage = element.scrollTop / (element.scrollHeight - element.clientHeight);
      onScroll(scrollPercentage, 'preview');
    }
  };

  return React.createElement('div', {
    ref: previewRef,
    className: 'preview',
    style: {
      padding: '15px',
      height: '100%',
      overflow: 'auto',
      backgroundColor: 'var(--preview-bg)',
      color: 'var(--preview-text)',
      fontFamily: 'Georgia, serif',
      lineHeight: '1.6',
      boxSizing: 'border-box',
      minWidth: 0 // Prevent flex shrinking issues
    },
    onScroll: handleScrollEvent,
    dangerouslySetInnerHTML: { __html: renderMarkdown(content) }
  });
}

// File Explorer Component
function FileExplorer({ currentFolder, onFileClick, onFolderChange }) {
  const [folderContents, setFolderContents] = useState([]);
  const [subfolderContents, setSubfolderContents] = useState(new Map());
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (currentFolder) {
      loadFolderContents(currentFolder);
    }
  }, [currentFolder]);
  
  const loadFolderContents = async (folderPath) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.readDirectory(folderPath);
      if (result.success) {
        setFolderContents(result.items);
      } else {
        console.error('Failed to read directory:', result.error);
        setFolderContents([]);
      }
    } catch (error) {
      console.error('Error reading directory:', error);
      setFolderContents([]);
    }
    setLoading(false);
  };
  
  const loadSubfolderContents = async (folderPath) => {
    try {
      const result = await window.electronAPI.readDirectory(folderPath);
      if (result.success) {
        setSubfolderContents(prev => new Map(prev.set(folderPath, result.items)));
      } else {
        console.error('Failed to read subdirectory:', result.error);
      }
    } catch (error) {
      console.error('Error reading subdirectory:', error);
    }
  };
  
  const toggleFolder = async (folderPath) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
      // Load the folder contents if not already loaded
      if (!subfolderContents.has(folderPath)) {
        await loadSubfolderContents(folderPath);
      }
    }
    setExpandedFolders(newExpanded);
  };
  
  const isMarkdownFile = (filename) => {
    const ext = filename.toLowerCase();
    return ext.endsWith('.md') || ext.endsWith('.markdown') || ext.endsWith('.txt');
  };
  
  const renderItem = (item, depth = 0) => {
    const isExpanded = expandedFolders.has(item.path);
    const paddingLeft = 8 + (depth * 16);
    
    if (item.isDirectory) {
      const contents = subfolderContents.get(item.path) || [];
      return React.createElement('div', {
        key: item.path,
        style: { marginBottom: '2px' }
      },
        // Folder header
        React.createElement('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            padding: `4px 8px 4px ${paddingLeft}px`,
            cursor: 'pointer',
            fontSize: '13px',
            color: '#333',
            borderRadius: '3px'
          },
          onClick: () => toggleFolder(item.path),
          onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
          onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
        },
          React.createElement('span', {
            style: { 
              marginRight: '6px',
              fontSize: '10px',
              color: '#666'
            }
          }, isExpanded ? '▼' : '▶'),
          React.createElement('span', {
            style: { marginRight: '6px' }
          }, '📁'),
          React.createElement('span', null, item.name)
        ),
        
        // Render subfolder contents if expanded
        isExpanded && contents.map(subItem => renderItem(subItem, depth + 1))
      );
    } else if (item.isFile && isMarkdownFile(item.name)) {
      return React.createElement('div', {
        key: item.path,
        style: {
          display: 'flex',
          alignItems: 'center',
          padding: `4px 8px 4px ${paddingLeft + 16}px`,
          cursor: 'pointer',
          fontSize: '13px',
          color: '#333',
          borderRadius: '3px',
          marginBottom: '2px'
        },
        onClick: () => onFileClick(item.path),
        onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
        onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
      },
        React.createElement('span', {
          style: { marginRight: '6px' }
        }, '📄'),
        React.createElement('span', null, item.name)
      );
    }
    return null;
  };
  
  if (!currentFolder) {
    return React.createElement('div', {
      style: {
        padding: '15px',
        textAlign: 'center',
        color: '#666',
        fontSize: '13px'
      }
    }, 'No folder selected\nUse File → Open Folder...');
  }
  
  return React.createElement('div', {
    style: {
      height: '100%',
      overflow: 'auto',
      fontSize: '13px'
    }
  },
    // Folder header
    React.createElement('div', {
      style: {
        padding: '8px',
        borderBottom: '1px solid #eee',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#333',
        backgroundColor: '#f8f8f8'
      }
    }, currentFolder.split('/').pop() || currentFolder),
    
    // Contents
    React.createElement('div', {
      style: { padding: '8px' }
    },
      loading ? 
        React.createElement('div', {
          style: { 
            textAlign: 'center',
            color: '#666',
            padding: '20px'
          }
        }, 'Loading...') :
        folderContents.map(renderItem)
    )
  );
}

// Splitter Component for resizing
function Splitter({ onMouseDown, direction = 'vertical' }) {
  return React.createElement('div', {
    style: {
      width: direction === 'vertical' ? '4px' : '100%',
      height: direction === 'horizontal' ? '4px' : '100%',
      backgroundColor: '#ddd',
      cursor: direction === 'vertical' ? 'col-resize' : 'row-resize',
      position: 'relative',
      zIndex: 10
    },
    onMouseDown: onMouseDown,
    onMouseEnter: (e) => {
      e.target.style.backgroundColor = '#bbb';
    },
    onMouseLeave: (e) => {
      e.target.style.backgroundColor = '#ddd';
    }
  });
}

// Table Size Selector Component
function TableSizeSelector({ onSelect, onClose }) {
  const [hoveredCell, setHoveredCell] = useState({ row: 3, col: 3 });
  
  const maxRows = 8;
  const maxCols = 8;
  
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${maxCols}, 16px)`,
    gap: '1px',
    padding: '8px',
    backgroundColor: '#f8f8f8'
  };
  
  const cellStyle = (row, col) => ({
    width: '16px',
    height: '16px',
    border: '1px solid #ddd',
    backgroundColor: (row <= hoveredCell.row && col <= hoveredCell.col) ? '#4CAF50' : '#fff',
    cursor: 'pointer'
  });
  
  const handleCellHover = (row, col) => {
    setHoveredCell({ row, col });
  };
  
  const handleCellClick = (row, col) => {
    onSelect(row, col);
    onClose();
  };
  
  const cells = [];
  for (let row = 1; row <= maxRows; row++) {
    for (let col = 1; col <= maxCols; col++) {
      cells.push(
        React.createElement('div', {
          key: `${row}-${col}`,
          style: cellStyle(row, col),
          onMouseEnter: () => handleCellHover(row, col),
          onClick: () => handleCellClick(row, col)
        })
      );
    }
  }
  
  return React.createElement('div', {
    style: {
      backgroundColor: '#fff',
      border: '1px solid #ccc',
      borderRadius: '4px',
      padding: '4px'
    }
  },
    React.createElement('div', {
      style: {
        textAlign: 'center',
        fontSize: '12px',
        color: '#666',
        marginBottom: '4px'
      }
    }, `${hoveredCell.row} × ${hoveredCell.col} Table`),
    
    React.createElement('div', { style: gridStyle }, ...cells)
  );
}

// Table Dropdown Component
function TableDropdown({ onFormat }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const dropdownRef = useRef(null);
  
  const buttonStyle = {
    border: '1px solid #ddd',
    backgroundColor: '#f8f8f8',
    color: '#333',
    padding: '6px 10px',
    margin: '0 2px',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '3px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  };
  
  const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    left: '0',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 1000,
    minWidth: '180px',
    padding: '4px 0'
  };
  
  const menuItemStyle = {
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#333',
    borderBottom: '1px solid #f0f0f0'
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowSizeSelector(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleAction = (action, ...args) => {
    onFormat(action, ...args);
    setIsOpen(false);
    setShowSizeSelector(false);
  };
  
  const handleTableSizeSelect = (rows, cols) => {
    handleAction('insert-table-size', rows, cols);
  };
  
  return React.createElement('div', {
    ref: dropdownRef,
    style: { position: 'relative', display: 'inline-block' }
  },
    React.createElement('button', {
      style: {
        ...buttonStyle,
        backgroundColor: isOpen ? '#e8e8e8' : buttonStyle.backgroundColor
      },
      onClick: () => setIsOpen(!isOpen),
      title: 'Table Operations'
    }, 
      React.createElement('span', { style: { fontSize: '16px' } }, '⊞'),
      'Table',
      React.createElement('span', { style: { fontSize: '10px', marginLeft: '4px' } }, '▼')
    ),
    
    isOpen && !showSizeSelector && React.createElement('div', { style: dropdownStyle },
      React.createElement('div', {
        style: menuItemStyle,
        onClick: () => setShowSizeSelector(true),
        onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
        onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
      }, '📊 Insert Table...'),
      
      React.createElement('div', {
        style: menuItemStyle,
        onClick: () => handleAction('insert-table'),
        onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
        onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
      }, '📋 Quick Table (3×3)'),
      
      React.createElement('div', {
        style: { ...menuItemStyle, borderBottom: '2px solid #eee' }
      }),
      
      React.createElement('div', {
        style: menuItemStyle,
        onClick: () => handleAction('table-add-row-after'),
        onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
        onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
      }, '➕ Add Row After'),
      
      React.createElement('div', {
        style: menuItemStyle,
        onClick: () => handleAction('table-add-row-before'),
        onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
        onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
      }, '⬆️ Add Row Before'),
      
      React.createElement('div', {
        style: menuItemStyle,
        onClick: () => handleAction('table-delete-row'),
        onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
        onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
      }, '❌ Delete Row'),
      
      React.createElement('div', {
        style: { ...menuItemStyle, borderBottom: '2px solid #eee' },
        onClick: () => handleAction('table-add-column-after'),
        onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
        onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
      }, '➕ Add Column After'),
      
      React.createElement('div', {
        style: menuItemStyle,
        onClick: () => handleAction('table-add-column-before'),
        onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
        onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
      }, '⬅️ Add Column Before'),
      
      React.createElement('div', {
        style: { ...menuItemStyle, borderBottom: '2px solid #eee' },
        onClick: () => handleAction('table-delete-column'),
        onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
        onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
      }, '❌ Delete Column'),
      
      React.createElement('div', {
        style: menuItemStyle,
        onClick: () => handleAction('table-align-left'),
        onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
        onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
      }, '⬅️ Align Left'),
      
      React.createElement('div', {
        style: menuItemStyle,
        onClick: () => handleAction('table-align-center'),
        onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
        onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
      }, '⬌ Align Center'),
      
      React.createElement('div', {
        style: { ...menuItemStyle, borderBottom: 'none' },
        onClick: () => handleAction('table-align-right'),
        onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
        onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
      }, '➡️ Align Right')
    ),
    
    isOpen && showSizeSelector && React.createElement('div', {
      style: {
        ...dropdownStyle,
        padding: '8px'
      }
    },
      React.createElement('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }
      },
        React.createElement('span', {
          style: { fontSize: '13px', fontWeight: 'bold' }
        }, 'Select Table Size'),
        React.createElement('button', {
          style: {
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: '#666'
          },
          onClick: () => setShowSizeSelector(false)
        }, '←')
      ),
      React.createElement(TableSizeSelector, {
        onSelect: handleTableSizeSelect,
        onClose: () => setShowSizeSelector(false)
      })
    )
  );
}

// Toolbar Component for markdown formatting
function Toolbar({ onFormat }) {
  const buttonStyle = {
    border: '1px solid var(--border-medium)',
    backgroundColor: 'var(--bg-accent)',
    color: 'var(--text-primary)',
    padding: '6px 10px',
    margin: '0 2px',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '3px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  };
  
  const buttonHoverStyle = {
    backgroundColor: 'var(--accent-primary)',
    color: 'var(--text-inverse)',
    borderColor: 'var(--accent-primary)'
  };
  
  const createButton = (label, action, title, icon = null) => {
    return React.createElement('button', {
      style: buttonStyle,
      onClick: () => onFormat(action),
      title: title,
      onMouseEnter: (e) => {
        e.target.style.backgroundColor = buttonHoverStyle.backgroundColor;
        e.target.style.borderColor = buttonHoverStyle.borderColor;
      },
      onMouseLeave: (e) => {
        e.target.style.backgroundColor = buttonStyle.backgroundColor;
        e.target.style.borderColor = buttonStyle.border.split(' ')[2];
      }
    }, 
      icon && React.createElement('span', { style: { fontSize: '16px' } }, icon),
      label
    );
  };
  
  const createSeparator = () => {
    return React.createElement('div', {
      style: {
        width: '1px',
        height: '24px',
        backgroundColor: 'var(--border-medium)',
        margin: '0 8px'
      }
    });
  };
  
  return React.createElement('div', {
    className: 'toolbar',
    style: {
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '4px',
      fontSize: '13px'
    }
  },
    // Heading buttons
    createButton('H1', 'h1', 'Heading 1'),
    createButton('H2', 'h2', 'Heading 2'),
    createButton('H3', 'h3', 'Heading 3'),
    createSeparator(),
    
    // Text formatting
    createButton('B', 'bold', 'Bold (Ctrl+B)', '𝐁'),
    createButton('I', 'italic', 'Italic (Ctrl+I)', '𝐼'),
    createButton('S', 'strikethrough', 'Strikethrough', 'S̶'),
    createSeparator(),
    
    // Lists
    createButton('• List', 'ul', 'Bulleted List', '•'),
    createButton('1. List', 'ol', 'Numbered List', '1.'),
    createButton('Quote', 'quote', 'Blockquote', '❝'),
    createSeparator(),
    
    // Links and media
    createButton('Link', 'link', 'Insert Link (Ctrl+K)', '🔗'),
    createButton('Image', 'image', 'Insert Image', '🖼️'),
    createButton('Code', 'code', 'Inline Code', '⟨⟩'),
    createButton('Code Block', 'codeblock', 'Code Block', '⟨/⟩'),
    createSeparator(),
    
    // Table dropdown and other
    React.createElement(TableDropdown, { onFormat }),
    createButton('HR', 'hr', 'Horizontal Rule', '―')
  );
}

// Preferences Dialog Component
function PreferencesDialog({ isOpen, onClose, preferences, onSave }) {
  const [localPrefs, setLocalPrefs] = useState({ ...preferences });
  
  if (!isOpen) return null;
  
  const handleSave = () => {
    onSave(localPrefs);
    onClose();
  };
  
  const handleFolderSelect = async (type) => {
    try {
      const result = await window.electronAPI.showFolderDialog();
      if (result.success && !result.canceled) {
        setLocalPrefs(prev => ({
          ...prev,
          [type]: result.folderPath
        }));
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  };
  
  return React.createElement('div', {
    className: 'modal-backdrop',
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    onClick: (e) => {
      if (e.target === e.currentTarget) onClose();
    }
  },
    React.createElement('div', {
      className: 'modal-content',
      style: {
        padding: '20px',
        borderRadius: '8px',
        minWidth: '500px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto'
      }
    },
      React.createElement('h2', {
        style: { 
          margin: '0 0 20px 0',
          color: 'var(--text-primary)'
        }
      }, 'Preferences'),
      
      // Theme Setting
      React.createElement('div', {
        style: { marginBottom: '20px' }
      },
        React.createElement('label', {
          style: { 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold',
            color: 'var(--text-primary)'
          }
        }, 'Theme'),
        React.createElement('select', {
          value: localPrefs.theme || 'light',
          onChange: (e) => setLocalPrefs(prev => ({
            ...prev,
            theme: e.target.value
          })),
          style: {
            width: '100%',
            padding: '8px',
            border: '1px solid var(--border-medium)',
            borderRadius: '4px',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)'
          }
        },
          React.createElement('option', { value: 'light' }, 'Light'),
          React.createElement('option', { value: 'dark' }, 'Dark'),
          React.createElement('option', { value: 'forest-green' }, 'Forest Green'),
          React.createElement('option', { value: 'blue-moon' }, 'Blue Moon'),
          React.createElement('option', { value: 'monochrome' }, 'Monochrome'),
          React.createElement('option', { value: 'valentine' }, 'Valentine'),
          React.createElement('option', { value: 'desert' }, 'Desert'),
          React.createElement('option', { value: 'polar' }, 'Polar'),
          React.createElement('option', { value: 'orange-blossom' }, 'Orange Blossom'),
          React.createElement('option', { value: 'christmas' }, 'Christmas')
        )
      ),
      
      // Default Folder Setting
      React.createElement('div', {
        style: { marginBottom: '20px' }
      },
        React.createElement('label', {
          style: { 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold' 
          }
        }, 'Default Folder'),
        React.createElement('div', {
          style: { display: 'flex', gap: '8px' }
        },
          React.createElement('input', {
            type: 'text',
            value: localPrefs.defaultFolder || '',
            readOnly: true,
            placeholder: 'No default folder selected',
            style: {
              flex: 1,
              padding: '8px',
              border: '1px solid var(--border-medium)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)'
            }
          }),
          React.createElement('button', {
            onClick: () => handleFolderSelect('defaultFolder'),
            style: {
              padding: '8px 12px',
              border: '1px solid var(--border-medium)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-accent)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }
          }, 'Browse'),
          localPrefs.defaultFolder && React.createElement('button', {
            onClick: () => setLocalPrefs(prev => ({
              ...prev,
              defaultFolder: null
            })),
            style: {
              padding: '8px 12px',
              border: '1px solid var(--border-medium)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-accent)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }
          }, 'Clear')
        )
      ),
      
      // Templates Folder Setting
      React.createElement('div', {
        style: { marginBottom: '20px' }
      },
        React.createElement('label', {
          style: { 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold',
            color: 'var(--text-primary)'
          }
        }, 'Templates Folder'),
        React.createElement('div', {
          style: { display: 'flex', gap: '8px' }
        },
          React.createElement('input', {
            type: 'text',
            value: localPrefs.templatesFolder || '',
            readOnly: true,
            placeholder: 'No templates folder selected',
            style: {
              flex: 1,
              padding: '8px',
              border: '1px solid var(--border-medium)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)'
            }
          }),
          React.createElement('button', {
            onClick: () => handleFolderSelect('templatesFolder'),
            style: {
              padding: '8px 12px',
              border: '1px solid var(--border-medium)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-accent)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }
          }, 'Browse'),
          localPrefs.templatesFolder && React.createElement('button', {
            onClick: () => setLocalPrefs(prev => ({
              ...prev,
              templatesFolder: null
            })),
            style: {
              padding: '8px 12px',
              border: '1px solid var(--border-medium)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-accent)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }
          }, 'Clear')
        )
      ),
      
      // Auto Save Setting
      React.createElement('div', {
        style: { marginBottom: '20px' }
      },
        React.createElement('label', {
          style: { 
            display: 'flex', 
            alignItems: 'center',
            gap: '8px' 
          }
        },
          React.createElement('input', {
            type: 'checkbox',
            checked: localPrefs.autoSave || false,
            onChange: (e) => setLocalPrefs(prev => ({
              ...prev,
              autoSave: e.target.checked
            }))
          }),
          React.createElement('span', { 
            style: { 
              fontWeight: 'bold',
              color: 'var(--text-primary)'
            } 
          }, 'Enable Auto Save')
        ),
        localPrefs.autoSave && React.createElement('div', {
          style: { marginTop: '8px', marginLeft: '26px' }
        },
          React.createElement('label', {
            style: { 
              display: 'block', 
              marginBottom: '4px', 
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }
          }, 'Auto Save Interval (seconds)'),
          React.createElement('input', {
            type: 'number',
            min: 5,
            max: 300,
            value: Math.floor((localPrefs.autoSaveInterval || 30000) / 1000),
            onChange: (e) => setLocalPrefs(prev => ({
              ...prev,
              autoSaveInterval: parseInt(e.target.value) * 1000
            })),
            style: {
              width: '80px',
              padding: '4px 8px',
              border: '1px solid var(--border-medium)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }
          })
        )
      ),
      
      // Action Buttons
      React.createElement('div', {
        style: {
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-light)'
        }
      },
        React.createElement('button', {
          onClick: onClose,
          style: {
            padding: '8px 16px',
            border: '1px solid var(--border-medium)',
            borderRadius: '4px',
            backgroundColor: 'var(--bg-accent)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }
        }, 'Cancel'),
        React.createElement('button', {
          onClick: handleSave,
          style: {
            padding: '8px 16px',
            border: '1px solid var(--accent-primary)',
            borderRadius: '4px',
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--text-inverse)',
            cursor: 'pointer'
          }
        }, 'Save')
      )
    )
  );
}

// Template Selection Dialog Component
function TemplateDialog({ isOpen, onClose, templates, onSelect }) {
  if (!isOpen) return null;
  
  const handleSelect = (template) => {
    onSelect(template);
    onClose();
  };
  
  return React.createElement('div', {
    className: 'modal-backdrop',
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    onClick: (e) => {
      if (e.target === e.currentTarget) onClose();
    }
  },
    React.createElement('div', {
      className: 'modal-content',
      style: {
        padding: '20px',
        borderRadius: '8px',
        minWidth: '400px',
        maxWidth: '500px',
        maxHeight: '60vh',
        overflow: 'auto'
      }
    },
      React.createElement('h2', {
        style: { 
          margin: '0 0 20px 0',
          color: 'var(--text-primary)'
        }
      }, 'Choose Template'),
      
      templates.length === 0 ? React.createElement('p', {
        style: { 
          color: 'var(--text-secondary)', 
          textAlign: 'center', 
          margin: '20px 0' 
        }
      }, 'No templates found. Configure a templates folder in Preferences.') : 
      
      React.createElement('div', {
        style: { marginBottom: '20px' }
      },
        React.createElement('div', {
          style: {
            border: '1px solid var(--border-medium)',
            borderRadius: '4px',
            maxHeight: '300px',
            overflow: 'auto',
            backgroundColor: 'var(--bg-primary)'
          }
        },
          templates.map(template => 
            React.createElement('div', {
              key: template.path,
              style: {
                padding: '12px',
                borderBottom: '1px solid var(--border-light)',
                cursor: 'pointer',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              },
              onMouseEnter: (e) => e.target.style.backgroundColor = 'var(--bg-accent)',
              onMouseLeave: (e) => e.target.style.backgroundColor = 'var(--bg-primary)',
              onClick: () => handleSelect(template)
            },
              React.createElement('div', {
                style: { 
                  fontWeight: 'bold', 
                  marginBottom: '4px',
                  color: 'var(--text-primary)'
                }
              }, template.name),
              React.createElement('div', {
                style: { 
                  fontSize: '12px', 
                  color: 'var(--text-secondary)'
                }
              }, template.path)
            )
          )
        )
      ),
      
      React.createElement('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-light)'
        }
      },
        React.createElement('button', {
          onClick: () => handleSelect(null),
          style: {
            padding: '8px 16px',
            border: '1px solid var(--border-medium)',
            borderRadius: '4px',
            backgroundColor: 'var(--bg-accent)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }
        }, 'Blank File'),
        React.createElement('button', {
          onClick: onClose,
          style: {
            padding: '8px 16px',
            border: '1px solid var(--border-medium)',
            borderRadius: '4px',
            backgroundColor: 'var(--bg-accent)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }
        }, 'Cancel')
      )
    )
  );
}

function App() {
  const [tabs, setTabs] = useState([{
    id: Date.now(),
    name: 'Untitled.md',
    content: '# Welcome to willisMD\n\nStart typing to see your markdown!',
    path: null,
    isDirty: false
  }]);
  
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [status, setStatus] = useState('Ready');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null);
  
  // Panel visibility state
  const [isExplorerVisible, setIsExplorerVisible] = useState(true);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  
  // Panel width state
  const [explorerWidth, setExplorerWidth] = useState(250);
  const [editorWidth, setEditorWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  
  // Editor formatting state
  const editorFormatHandlerRef = useRef(null);
  
  // Scroll synchronization state
  const [editorScrollPercentage, setEditorScrollPercentage] = useState(null);
  const [previewScrollPercentage, setPreviewScrollPercentage] = useState(null);
  const [lastScrollSource, setLastScrollSource] = useState(null);
  
  // Preferences state
  const [preferences, setPreferences] = useState({});
  const [showPreferences, setShowPreferences] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  
  // Editor ref for find/replace
  const editorTextareaRef = useRef(null);
  
  // Get current tab
  const currentTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
  
  // Debug effect for showAboutDialog
  useEffect(() => {
    console.log('App: showAboutDialog state changed to:', showAboutDialog);
  }, [showAboutDialog]);
  
  // Use ref to access current tab in callbacks
  const currentTabRef = useRef(currentTab);
  currentTabRef.current = currentTab;
  
  // Use ref for tabs to access in callbacks
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  
  // Auto-save timer ref
  const autoSaveTimerRef = useRef(null);
  
  // Theme helper function
  const applyTheme = (theme) => {
    const root = document.documentElement;
    const validThemes = [
      'light', 'dark', 'forest-green', 'blue-moon', 'monochrome',
      'valentine', 'desert', 'polar', 'orange-blossom', 'christmas'
    ];
    
    if (validThemes.includes(theme) && theme !== 'light') {
      root.setAttribute('data-theme', theme);
    } else {
      // Default to light theme (no data-theme attribute needed)
      root.removeAttribute('data-theme');
    }
    
    console.log('Applied theme:', theme);
  };
  
  // Preferences handlers
  const handleShowPreferences = () => {
    console.log('App: Show preferences requested');
    setShowPreferences(true);
  };
  
  // About dialog handler
  const handleShowAbout = () => {
    console.log('App: Show about requested - handleShowAbout called');
    console.log('App: Current showAboutDialog state:', showAboutDialog);
    setShowAboutDialog(true);
    console.log('App: Setting showAboutDialog to true');
  };
  
  // Find/Replace handler
  const handleShowFindReplace = (withReplace = false) => {
    console.log('App: Show find/replace requested, withReplace:', withReplace);
    setShowFindReplace(true);
  };
  
  const handleSavePreferences = async (newPreferences) => {
    console.log('App: Saving preferences', newPreferences);
    try {
      const result = await window.electronAPI.preferencesSave(newPreferences);
      setPreferences(newPreferences);
      
      // Apply theme immediately
      applyTheme(newPreferences.theme);
      
      // Update auto save if changed
      if (newPreferences.autoSave !== autoSaveEnabled) {
        setAutoSaveEnabled(newPreferences.autoSave);
      }
      
      setStatus('✓ Preferences saved');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setStatus(`✗ Failed to save preferences: ${error.message}`);
    }
  };
  
  
  const handleTemplateSelect = async (template) => {
    console.log('App: Template selected', template);
    
    let content = '# New Document\n\nStart typing here...';
    let name = `Untitled-${tabs.filter(t => !t.path).length + 1}.md`;
    
    if (template) {
      try {
        const result = await window.electronAPI.readFile(template.path);
        if (result.success) {
          content = result.content;
          // Create untitled document with template content, not a named file
          name = `Untitled-${tabs.filter(t => !t.path).length + 1}.md`;
        } else {
          setStatus(`✗ Failed to read template: ${result.error}`);
          return;
        }
      } catch (error) {
        console.error('Failed to read template:', error);
        setStatus(`✗ Failed to read template: ${error.message}`);
        return;
      }
    }
    
    const newTab = {
      id: Date.now(),
      name: name,
      content: content,
      path: null, // Explicitly null - this is an unsaved document
      isDirty: template ? true : false // Mark as dirty if content came from template
    };
    
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setStatus(template ? `✓ New file created from template: ${template.name}` : '✓ New file created');
  };
  
  useEffect(() => {
    console.log('App: Setting up IPC listeners');
    
    if (!window.electronAPI) {
      console.error('App: electronAPI not found');
      setStatus('Error: No file operations available');
      return;
    }
    
    console.log('App: electronAPI found');
    setStatus('Ready - File operations available');
    
    // Set up file open handler
    const handleFileOpen = (filePath) => {
      console.log('App: Received file open request:', filePath);
      setStatus(`Opening: ${filePath.split('/').pop()}`);
      
      window.electronAPI.readFile(filePath)
        .then(result => {
          console.log('App: File read result:', result);
          
          if (result && result.success) {
            // Check if file is already open
            const existingTab = tabsRef.current.find(tab => tab.path === filePath);
            if (existingTab) {
              setActiveTabId(existingTab.id);
              setStatus(`✓ Switched to: ${existingTab.name}`);
            } else {
              // Create new tab
              const newTab = {
                id: Date.now(),
                name: filePath.split('/').pop(),
                content: result.content,
                path: filePath,
                isDirty: false
              };
              setTabs(prev => [...prev, newTab]);
              setActiveTabId(newTab.id);
              setStatus(`✓ Loaded: ${newTab.name}`);
            }
          } else {
            setStatus(`✗ Error: ${result?.error || 'Unknown error'}`);
          }
        })
        .catch(error => {
          console.error('App: Error reading file:', error);
          setStatus(`✗ Error: ${error.message}`);
        });
    };
    
    // Set up save handler
    const handleSave = async () => {
      console.log('App: Save requested');
      const current = currentTabRef.current;
      
      if (current.path) {
        // Save to existing path
        setStatus(`Saving: ${current.name}`);
        
        try {
          const result = await window.electronAPI.writeFile(current.path, current.content);
          if (result.success) {
            setTabs(prev => prev.map(tab => 
              tab.id === current.id ? { ...tab, isDirty: false } : tab
            ));
            setStatus(`✓ Saved: ${current.name}`);
          } else {
            setStatus(`✗ Save failed: ${result.error}`);
          }
        } catch (error) {
          setStatus(`✗ Save error: ${error.message}`);
        }
      } else {
        // No path, trigger save as
        handleSaveAs();
      }
    };
    
    // Set up save as handler
    const handleSaveAs = async () => {
      console.log('App: Save As requested');
      const current = currentTabRef.current;
      
      try {
        const dialogResult = await window.electronAPI.showSaveDialog();
        
        if (dialogResult.success && dialogResult.filePath) {
          setStatus(`Saving to: ${dialogResult.filePath.split('/').pop()}`);
          
          const saveResult = await window.electronAPI.writeFile(dialogResult.filePath, current.content);
          
          if (saveResult.success) {
            setTabs(prev => prev.map(tab => 
              tab.id === current.id ? {
                ...tab,
                path: dialogResult.filePath,
                name: dialogResult.filePath.split('/').pop(),
                isDirty: false
              } : tab
            ));
            setStatus(`✓ Saved: ${dialogResult.filePath.split('/').pop()}`);
          } else {
            setStatus(`✗ Save failed: ${saveResult.error}`);
          }
        }
      } catch (error) {
        setStatus(`✗ Save error: ${error.message}`);
      }
    };
    
    // Set up new file handler
    const handleNewFile = () => {
      console.log('App: New file requested');
      const newTab = {
        id: Date.now(),
        name: `Untitled-${tabsRef.current.filter(t => !t.path).length + 1}.md`,
        content: '# New Document\n\n',
        path: null,
        isDirty: false
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
      setStatus('New file created');
    };
    
    const handleNewFileFromTemplate = async () => {
      console.log('App: New file from template requested');
      try {
        const templates = await window.electronAPI.getTemplates();
        setTemplates(templates);
        setShowTemplateDialog(true);
      } catch (error) {
        console.error('Failed to get templates:', error);
        setStatus(`✗ Failed to load templates: ${error.message}`);
      }
    };
    
    // Set up auto-save toggle handler
    const handleToggleAutosave = (enabled) => {
      console.log('App: Auto-save toggled:', enabled);
      setAutoSaveEnabled(enabled);
      setStatus(enabled ? 'Auto-save enabled' : 'Auto-save disabled');
    };
    
    // Set up folder open handler
    const handleOpenFolder = (folderPath) => {
      console.log('App: Open folder requested:', folderPath);
      setCurrentFolder(folderPath);
      setStatus(`Opened folder: ${folderPath.split('/').pop()}`);
      
      // Add to recent folders
      window.electronAPI.addRecentFolder(folderPath).catch(error => {
        console.error('Failed to add to recent folders:', error);
      });
    };
    
    // Set up panel toggle handlers from menu
    const handleMenuToggleExplorer = () => {
      console.log('App: Toggle explorer from menu');
      toggleExplorer();
    };
    
    const handleMenuTogglePreview = () => {
      console.log('App: Toggle preview from menu');
      togglePreview();
    };
    
    // Export handlers
    const handleExportPDF = async () => {
      console.log('App: Export PDF requested');
      const current = currentTabRef.current;
      if (!current.content.trim()) {
        setStatus('✗ No content to export');
        return;
      }
      
      setStatus('Exporting to PDF...');
      try {
        const result = await window.electronAPI.exportPDF({
          markdown: current.content,
          title: current.name || 'document'
        });
        
        if (result.success) {
          setStatus(`✓ PDF exported: ${result.path.split('/').pop()}`);
        } else if (result.canceled) {
          setStatus('Export canceled');
        } else {
          setStatus(`✗ PDF export failed: ${result.error}`);
        }
      } catch (error) {
        setStatus(`✗ Export error: ${error.message}`);
      }
    };
    
    const handleExportHTML = async () => {
      console.log('App: Export HTML requested');
      const current = currentTabRef.current;
      if (!current.content.trim()) {
        setStatus('✗ No content to export');
        return;
      }
      
      setStatus('Exporting to HTML...');
      try {
        const result = await window.electronAPI.exportHTML({
          markdown: current.content,
          title: current.name || 'document'
        });
        
        if (result.success) {
          setStatus(`✓ HTML exported: ${result.path.split('/').pop()}`);
        } else if (result.canceled) {
          setStatus('Export canceled');
        } else {
          setStatus(`✗ HTML export failed: ${result.error}`);
        }
      } catch (error) {
        setStatus(`✗ Export error: ${error.message}`);
      }
    };
    
    const handleExportEPUB = async () => {
      console.log('App: Export EPUB requested');
      const current = currentTabRef.current;
      if (!current.content.trim()) {
        setStatus('✗ No content to export');
        return;
      }
      
      setStatus('Exporting to EPUB...');
      try {
        const result = await window.electronAPI.exportEPUB({
          markdown: current.content,
          title: current.name || 'document',
          author: 'willisMD User'
        });
        
        if (result.success) {
          setStatus(`✓ EPUB exported: ${result.path.split('/').pop()}`);
        } else if (result.canceled) {
          setStatus('Export canceled');
        } else {
          setStatus(`✗ EPUB export failed: ${result.error}`);
        }
      } catch (error) {
        setStatus(`✗ Export error: ${error.message}`);
      }
    };
    
    const handleExportDOCX = async () => {
      console.log('App: Export DOCX requested');
      const current = currentTabRef.current;
      if (!current.content.trim()) {
        setStatus('✗ No content to export');
        return;
      }
      
      setStatus('Exporting to DOCX...');
      try {
        const result = await window.electronAPI.exportDOCX({
          markdown: current.content,
          title: current.name || 'document'
        });
        
        if (result.success) {
          setStatus(`✓ DOCX exported: ${result.path.split('/').pop()}`);
        } else if (result.canceled) {
          setStatus('Export canceled');
        } else {
          setStatus(`✗ DOCX export failed: ${result.error}`);
        }
      } catch (error) {
        setStatus(`✗ Export error: ${error.message}`);
      }
    };
    
    // Save confirmation handlers
    const handleCheckUnsavedChanges = () => {
      console.log('App: Checking for unsaved changes');
      const currentTabs = tabsRef.current;
      const hasUnsaved = currentTabs.some(tab => tab.isDirty);
      console.log('App: Found unsaved tabs:', hasUnsaved, 'Total tabs:', currentTabs.length);
      
      // Log tab details for debugging
      currentTabs.forEach(tab => {
        console.log(`Tab: ${tab.name}, isDirty: ${tab.isDirty}, path: ${tab.path}`);
      });
      
      window.electronAPI.sendUnsavedChangesResponse({ hasUnsaved });
    };
    
    const handleSaveAllBeforeQuit = async () => {
      console.log('App: Saving all before quit');
      
      try {
        const currentTabs = tabsRef.current;
        const unsavedTabs = currentTabs.filter(tab => tab.isDirty && tab.path);
        
        console.log(`App: Found ${unsavedTabs.length} unsaved tabs with paths`);
        
        for (const tab of unsavedTabs) {
          console.log(`Saving tab: ${tab.name}`);
          const result = await window.electronAPI.writeFile(tab.path, tab.content);
          if (!result.success) {
            console.error(`Failed to save ${tab.name}:`, result.error);
          } else {
            console.log(`Successfully saved: ${tab.name}`);
          }
        }
        
        console.log('App: All tabs saved, sending completion signal');
        window.electronAPI.sendSaveAllComplete();
        
      } catch (error) {
        console.error('Error saving tabs before quit:', error);
        window.electronAPI.sendSaveAllComplete();
      }
    };
    
    try {
      window.electronAPI.onOpenFile(handleFileOpen);
      window.electronAPI.onSaveFile(handleSave);
      window.electronAPI.onSaveFileAs(handleSaveAs);
      window.electronAPI.onNewFile(handleNewFile);
      window.electronAPI.onNewFileFromTemplate(handleNewFileFromTemplate);
      window.electronAPI.onToggleAutosave(handleToggleAutosave);
      window.electronAPI.onOpenFolder(handleOpenFolder);
      window.electronAPI.onToggleExplorer(handleMenuToggleExplorer);
      window.electronAPI.onTogglePreview(handleMenuTogglePreview);
      window.electronAPI.onExportPDF(handleExportPDF);
      window.electronAPI.onExportHTML(handleExportHTML);
      window.electronAPI.onExportEPUB(handleExportEPUB);
      window.electronAPI.onExportDOCX(handleExportDOCX);
      window.electronAPI.onShowPreferences(handleShowPreferences);
      console.log('App: Registering onShowAbout listener');
      window.electronAPI.onShowAbout(handleShowAbout);
      console.log('App: onShowAbout listener registered');
      window.electronAPI.onFind(() => handleShowFindReplace(false));
      window.electronAPI.onReplace(() => handleShowFindReplace(true));
      window.electronAPI.onCheckUnsavedChanges(handleCheckUnsavedChanges);
      window.electronAPI.onSaveAllBeforeQuit(handleSaveAllBeforeQuit);
      console.log('App: All listeners registered');
    } catch (error) {
      console.error('App: Error setting up listeners:', error);
      setStatus(`Setup Error: ${error.message}`);
    }
    
    // Store handlers in ref to access in cleanup
    return () => {
      // Clean up listeners if needed
      window.electronAPI.removeAllListeners('menu-open-file');
      window.electronAPI.removeAllListeners('menu-save-file');
      window.electronAPI.removeAllListeners('menu-save-file-as');
      window.electronAPI.removeAllListeners('menu-new-file');
      window.electronAPI.removeAllListeners('menu-toggle-autosave');
      window.electronAPI.removeAllListeners('menu-open-folder');
      window.electronAPI.removeAllListeners('menu-toggle-explorer');
      window.electronAPI.removeAllListeners('menu-toggle-preview');
      window.electronAPI.removeAllListeners('menu-show-preferences');
      window.electronAPI.removeAllListeners('menu-show-about');
      window.electronAPI.removeAllListeners('menu-find');
      window.electronAPI.removeAllListeners('menu-replace');
    };
  }, []);
  
  // Auto-save effect
  useEffect(() => {
    if (autoSaveEnabled && currentTab.isDirty && currentTab.path) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      // Set new timer (3 seconds delay)
      autoSaveTimerRef.current = setTimeout(async () => {
        console.log('Auto-saving...');
        setStatus('Auto-saving...');
        
        try {
          const result = await window.electronAPI.writeFile(currentTab.path, currentTab.content);
          if (result.success) {
            setTabs(prev => prev.map(tab => 
              tab.id === currentTab.id ? { ...tab, isDirty: false } : tab
            ));
            setStatus('✓ Auto-saved');
          } else {
            setStatus(`✗ Auto-save failed: ${result.error}`);
          }
        } catch (error) {
          setStatus(`✗ Auto-save error: ${error.message}`);
        }
      }, 3000); // 3 second delay
    }
    
    // Cleanup timer on unmount or when dependencies change
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSaveEnabled, currentTab.isDirty, currentTab.content, currentTab.path, currentTab.id]);

  // Load preferences on startup
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        console.log('Loading preferences...');
        const prefs = await window.electronAPI.preferencesLoad();
        setPreferences(prefs);
        
        // Apply theme
        applyTheme(prefs.theme);
        
        // Set auto save
        setAutoSaveEnabled(prefs.autoSave || false);
        
        // Open default folder if set
        if (prefs.defaultFolder) {
          setCurrentFolder(prefs.defaultFolder);
        }
        
        console.log('Preferences loaded:', prefs);
      } catch (error) {
        console.error('Failed to load preferences:', error);
        setStatus(`✗ Failed to load preferences: ${error.message}`);
      }
    };
    
    loadPreferences();
  }, []);

  const handleContentChange = (newContent) => {
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, content: newContent, isDirty: true } : tab
    ));
  };
  
  const closeTab = async (tabId) => {
    const tabToClose = tabs.find(tab => tab.id === tabId);
    if (!tabToClose) return;
    
    console.log('Attempting to close tab:', tabToClose.name, 'isDirty:', tabToClose.isDirty);
    
    // If tab has unsaved changes, show confirmation dialog
    if (tabToClose.isDirty) {
      try {
        const result = await window.electronAPI.showSaveConfirmation({
          fileName: tabToClose.name,
          hasUnsavedChanges: true
        });
        
        console.log('Save confirmation result:', result);
        
        if (result.action === 'cancel') {
          console.log('User canceled closing tab');
          return; // Don't close the tab
        }
        
        if (result.action === 'save') {
          // Save the file first
          if (tabToClose.path) {
            console.log('Saving before closing:', tabToClose.path);
            setStatus(`Saving: ${tabToClose.name}`);
            
            const saveResult = await window.electronAPI.writeFile(tabToClose.path, tabToClose.content);
            if (saveResult.success) {
              setStatus(`✓ Saved: ${tabToClose.name}`);
              // Update tab to mark as not dirty
              setTabs(prev => prev.map(tab => 
                tab.id === tabId ? { ...tab, isDirty: false } : tab
              ));
            } else {
              setStatus(`✗ Save failed: ${saveResult.error}`);
              return; // Don't close if save failed
            }
          } else {
            // No path, need to save as
            console.log('Tab has no path, triggering save as');
            setActiveTabId(tabId); // Make sure this tab is active for save as
            
            const dialogResult = await window.electronAPI.showSaveDialog();
            if (dialogResult.success && dialogResult.filePath) {
              const saveResult = await window.electronAPI.writeFile(dialogResult.filePath, tabToClose.content);
              if (saveResult.success) {
                setStatus(`✓ Saved: ${dialogResult.filePath.split('/').pop()}`);
                // Update tab with new path and mark as not dirty
                setTabs(prev => prev.map(tab => 
                  tab.id === tabId ? {
                    ...tab,
                    path: dialogResult.filePath,
                    name: dialogResult.filePath.split('/').pop(),
                    isDirty: false
                  } : tab
                ));
              } else {
                setStatus(`✗ Save failed: ${saveResult.error}`);
                return; // Don't close if save failed
              }
            } else {
              console.log('User canceled save as dialog');
              return; // Don't close if save as was canceled
            }
          }
        }
        // If action was 'dont-save', we just continue to close the tab
        
      } catch (error) {
        console.error('Error in save confirmation:', error);
        setStatus(`✗ Error: ${error.message}`);
        return; // Don't close if there was an error
      }
    }
    
    // Close the tab
    console.log('Closing tab:', tabToClose.name);
    if (tabs.length > 1) {
      const newTabs = tabs.filter(tab => tab.id !== tabId);
      setTabs(newTabs);
      
      // If we're closing the active tab, switch to another tab
      if (tabId === activeTabId) {
        const closedTabIndex = tabs.findIndex(tab => tab.id === tabId);
        const newActiveIndex = Math.min(closedTabIndex, newTabs.length - 1);
        setActiveTabId(newTabs[newActiveIndex].id);
      }
      
      setStatus(`Closed: ${tabToClose.name}`);
    }
  };
  
  // Handle scroll synchronization
  const handleScroll = (scrollPercentage, source) => {
    if (isNaN(scrollPercentage) || scrollPercentage < 0) return;
    
    setLastScrollSource(source);
    
    if (source === 'editor') {
      setEditorScrollPercentage(scrollPercentage);
      // Sync to preview with slight delay to avoid conflicts
      setTimeout(() => {
        setPreviewScrollPercentage(scrollPercentage);
      }, 10);
    } else if (source === 'preview') {
      setPreviewScrollPercentage(scrollPercentage);
      // Sync to editor with slight delay to avoid conflicts  
      setTimeout(() => {
        setEditorScrollPercentage(scrollPercentage);
      }, 10);
    }
  };
  
  // Handle file click from explorer
  const handleExplorerFileClick = (filePath) => {
    console.log('Explorer: File clicked:', filePath);
    
    // Check if file is already open
    const existingTab = tabsRef.current.find(tab => tab.path === filePath);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      setStatus(`✓ Switched to: ${existingTab.name}`);
      return;
    }
    
    // Open new file
    setStatus(`Opening: ${filePath.split('/').pop()}`);
    
    window.electronAPI.readFile(filePath)
      .then(result => {
        if (result && result.success) {
          const newTab = {
            id: Date.now(),
            name: filePath.split('/').pop(),
            content: result.content,
            path: filePath,
            isDirty: false
          };
          setTabs(prev => [...prev, newTab]);
          setActiveTabId(newTab.id);
          setStatus(`✓ Loaded: ${newTab.name}`);
          
          // Add to recent files
          window.electronAPI.addRecentFile(filePath).catch(error => {
            console.error('Failed to add to recent files:', error);
          });
        } else {
          setStatus(`✗ Error: ${result?.error || 'Unknown error'}`);
        }
      })
      .catch(error => {
        console.error('Explorer: Error reading file:', error);
        setStatus(`✗ Error: ${error.message}`);
      });
  };
  
  // Panel toggle functions
  const toggleExplorer = () => {
    setIsExplorerVisible(prev => !prev);
    setStatus(isExplorerVisible ? 'Explorer hidden' : 'Explorer shown');
  };
  
  const togglePreview = () => {
    setIsPreviewVisible(prev => !prev);
    setStatus(isPreviewVisible ? 'Preview hidden' : 'Preview shown');
  };
  
  // Handle toolbar formatting
  const handleToolbarFormat = (action) => {
    console.log('Toolbar format action:', action);
    if (editorFormatHandlerRef.current) {
      console.log('Calling editor format handler');
      editorFormatHandlerRef.current(action);
    } else {
      console.log('No editor format handler available');
    }
  };
  
  // Resize handlers
  const handleResizeStart = (e, type) => {
    e.preventDefault();
    setIsResizing(type);
    setResizeStartX(e.clientX);
    if (type === 'explorer') {
      setResizeStartWidth(explorerWidth);
    } else if (type === 'editor') {
      setResizeStartWidth(editorWidth);
    }
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };
  
  const handleResizeMove = (e) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - resizeStartX;
    
    if (isResizing === 'explorer') {
      const newWidth = Math.max(150, Math.min(600, resizeStartWidth + deltaX));
      setExplorerWidth(newWidth);
    } else if (isResizing === 'editor') {
      // Calculate percentage based on the editor/preview container
      const container = e.target.closest('.editor-preview-container');
      if (container) {
        const containerWidth = container.offsetWidth;
        const deltaPercent = (deltaX / containerWidth) * 100;
        const newPercent = Math.max(20, Math.min(80, resizeStartWidth + deltaPercent));
        setEditorWidth(newPercent);
      }
    }
  };
  
  const handleResizeEnd = () => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };
  
  // Add global mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, resizeStartX, resizeStartWidth]);

  return React.createElement('div', {
    className: 'app-container',
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }
  },
    
    // Tab bar
    React.createElement('div', {
      className: 'tab-bar',
      style: {
        display: 'flex',
        overflowX: 'auto',
        minHeight: '36px'
      }
    }, tabs.map(tab => 
      React.createElement('div', {
        key: tab.id,
        className: `tab ${tab.id === activeTabId ? 'active' : ''}`,
        style: {
          display: 'flex',
          alignItems: 'center',
          padding: '8px 10px',
          cursor: 'pointer',
          minWidth: '120px',
          maxWidth: '200px'
        },
        onClick: () => setActiveTabId(tab.id)
      },
        React.createElement('span', {
          style: {
            flex: 1,
            fontSize: '13px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }
        }, `${tab.name}${tab.isDirty ? ' •' : ''}`),
        tabs.length > 1 && React.createElement('button', {
          style: {
            marginLeft: '8px',
            padding: '2px 6px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          },
          onClick: (e) => {
            e.stopPropagation();
            closeTab(tab.id);
          }
        }, '✕')
      )
    )),
    
    // Toolbar
    React.createElement(Toolbar, {
      onFormat: handleToolbarFormat
    }),
    
    // Main content area with file explorer
    React.createElement('div', {
      style: {
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }
    },
      // File Explorer (left sidebar)
      currentFolder && isExplorerVisible && React.createElement('div', {
        className: 'sidebar',
        style: {
          width: `${explorerWidth}px`,
          display: 'flex',
          flexDirection: 'column'
        }
      },
        React.createElement('div', {
          className: 'sidebar-header',
          style: {
            padding: '5px 10px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }
        }, 
          React.createElement('span', null, 'Explorer'),
          React.createElement('button', {
            style: {
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#666',
              padding: '2px 4px'
            },
            onClick: toggleExplorer,
            title: 'Hide Explorer'
          }, '✕')
        ),
        React.createElement(FileExplorer, {
          currentFolder: currentFolder,
          onFileClick: handleExplorerFileClick
        })
      ),
      
      // Splitter between explorer and editor
      currentFolder && isExplorerVisible && React.createElement(Splitter, {
        onMouseDown: (e) => handleResizeStart(e, 'explorer'),
        direction: 'vertical'
      }),
      
      // Editor and Preview split view
      React.createElement('div', {
        className: 'editor-preview-container',
        style: {
          display: 'flex',
          flex: 1,
          overflow: 'hidden'
        }
      },
        // Editor pane (left)
        React.createElement('div', {
          style: {
            width: isPreviewVisible ? `${editorWidth}%` : '100%',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'hidden'
          }
        },
          React.createElement('div', {
            style: {
              padding: '5px 10px',
              backgroundColor: '#f8f8f8',
              borderBottom: '1px solid #eee',
              fontSize: '12px',
              color: '#666',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }
          }, 
            React.createElement('span', null, 'Editor'),
            React.createElement('div', {
              style: { display: 'flex', gap: '8px' }
            },
              // Explorer toggle (only show if there's a folder and explorer is hidden)
              currentFolder && !isExplorerVisible && React.createElement('button', {
                style: {
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: '#666',
                  padding: '2px 4px'
                },
                onClick: toggleExplorer,
                title: 'Show Explorer'
              }, '📁'),
              // Preview toggle
              React.createElement('button', {
                style: {
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: '#666',
                  padding: '2px 4px'
                },
                onClick: togglePreview,
                title: isPreviewVisible ? 'Hide Preview' : 'Show Preview'
              }, isPreviewVisible ? '👁️‍🗨️' : '👁️')
            )
          ),
          React.createElement('div', {
            style: { 
              position: 'relative', 
              height: '100%', 
              overflow: 'hidden',
              flex: 1
            }
          },
            React.createElement(Editor, {
              content: currentTab.content,
              onChange: handleContentChange,
              onScroll: handleScroll,
              scrollToPercentage: lastScrollSource === 'preview' ? editorScrollPercentage : null,
              onFormat: (handler) => {
                console.log('Setting editor format handler');
                editorFormatHandlerRef.current = handler;
              },
              onShowFindReplace: handleShowFindReplace,
              editorRef: editorTextareaRef,
              isFindReplaceOpen: showFindReplace
            }),
            React.createElement(FindReplace, {
              isOpen: showFindReplace,
              onClose: () => setShowFindReplace(false),
              textareaRef: editorTextareaRef,
              onContentChange: handleContentChange
            })
          )
        ),
        
        // Splitter between editor and preview
        isPreviewVisible && React.createElement(Splitter, {
          onMouseDown: (e) => handleResizeStart(e, 'editor'),
          direction: 'vertical'
        }),
        
        // Preview pane (right)
        isPreviewVisible && React.createElement('div', {
          style: {
            width: `${100 - editorWidth}%`,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'hidden'
          }
        },
          React.createElement('div', {
            style: {
              padding: '5px 10px',
              backgroundColor: '#f8f8f8',
              borderBottom: '1px solid #eee',
              fontSize: '12px',
              color: '#666',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }
          }, 
            React.createElement('span', null, 'Preview'),
            React.createElement('button', {
              style: {
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#666',
                padding: '2px 4px'
              },
              onClick: togglePreview,
              title: 'Hide Preview'
            }, '✕')
          ),
          React.createElement(Preview, {
            content: currentTab.content,
            onScroll: handleScroll,
            scrollToPercentage: lastScrollSource === 'editor' ? previewScrollPercentage : null
          })
        )
      )
    ),
    
    // Status bar (bottom)
    React.createElement('div', {
      className: 'status-bar',
      style: {
        padding: '5px 15px',
        fontSize: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    }, 
      React.createElement('span', null, status),
      autoSaveEnabled && React.createElement('span', {
        style: { 
          fontSize: '11px',
          color: '#888',
          fontStyle: 'italic'
        }
      }, '• Auto-save on')
    ),
    
    // Dialogs
    React.createElement(PreferencesDialog, {
      isOpen: showPreferences,
      onClose: () => setShowPreferences(false),
      preferences: preferences,
      onSave: handleSavePreferences
    }),
    
    React.createElement(TemplateDialog, {
      isOpen: showTemplateDialog,
      onClose: () => setShowTemplateDialog(false),
      templates: templates,
      onSelect: handleTemplateSelect
    }),
    
    React.createElement(AboutDialog, {
      isOpen: showAboutDialog,
      onClose: () => setShowAboutDialog(false)
    })
  );
}

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(React.createElement(App));