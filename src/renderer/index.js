import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { marked } from 'marked';
import { highlightMarkdown } from './SyntaxHighlighter';
import * as MarkdownUtils from './MarkdownUtils';
import AboutDialog from './components/AboutDialog';
import CodeMirrorEditor from './components/CodeMirrorEditor';
import { previewStyles, getStyleCSS, getStyleNames } from '../shared/previewStyles';
import './styles.css';
import './themes.css';


// Preview Component with scroll sync support and debounced rendering
function Preview({ content, onScroll, scrollToPercentage, currentFileDir, onWikiLinkClick, previewStyle = 'standard' }) {
  const previewRef = useRef(null);
  const [debouncedContent, setDebouncedContent] = useState(content);
  const [isUpdating, setIsUpdating] = useState(false);
  const renderTimeoutRef = useRef(null);
  
  // Debounce content updates for better performance
  useEffect(() => {
    // Clear any existing timeout
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }
    
    // Show updating indicator if content changed
    if (content !== debouncedContent) {
      setIsUpdating(true);
    }
    
    // Set a new timeout for updating the preview
    renderTimeoutRef.current = setTimeout(() => {
      // Use requestAnimationFrame for smooth updates
      requestAnimationFrame(() => {
        setDebouncedContent(content);
        setIsUpdating(false);
      });
    }, 300); // 300ms delay
    
    // Cleanup on unmount or when content changes
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [content]);
  
  // Process wiki links in content
  const processWikiLinks = (text) => {
    if (!text) return text;
    
    // Regex to match [[filename]] patterns
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    
    return text.replace(wikiLinkRegex, (match, filename) => {
      // Clean the filename and create a clickable link
      const cleanFilename = filename.trim();
      return `<a href="#" class="wiki-link" data-filename="${cleanFilename}" onclick="event.preventDefault(); window.handleWikiLinkClick('${cleanFilename}')">${cleanFilename}</a>`;
    });
  };
  
  // Memoize the rendered HTML to avoid re-parsing on every render
  const renderedHtml = React.useMemo(() => {
    if (!debouncedContent) return 'Preview will appear here...';
    try {
      // Process wiki links first, then run through markdown
      const processedContent = processWikiLinks(debouncedContent);
      return marked(processedContent);
    } catch (error) {
      console.error('Markdown rendering error:', error);
      return 'Error rendering markdown...';
    }
  }, [debouncedContent]);
  
  // Set up global wiki link click handler
  useEffect(() => {
    window.handleWikiLinkClick = (filename) => {
      if (onWikiLinkClick) {
        onWikiLinkClick(filename);
      }
    };
    
    // Cleanup
    return () => {
      delete window.handleWikiLinkClick;
    };
  }, [onWikiLinkClick]);
  
  // Handle all link clicks in the preview
  useEffect(() => {
    const handleLinkClick = (e) => {
      const link = e.target.closest('a');
      if (link && link.href) {
        console.log('Link clicked:', link.href);
        // Skip wiki links - they have their own handler
        if (!link.classList.contains('wiki-link')) {
          e.preventDefault();
          console.log('Preventing default navigation for:', link.href);
          
          // Check if it's an external link
          const url = link.href;
          if (url.startsWith('http://') || url.startsWith('https://')) {
            console.log('Opening external link:', url);
            // Open in external browser
            window.electronAPI.openExternal(url).then(result => {
              console.log('Open external result:', result);
            }).catch(error => {
              console.error('Error opening external link:', error);
            });
          }
        }
      }
    };
    
    const previewElement = previewRef.current;
    if (previewElement) {
      previewElement.addEventListener('click', handleLinkClick);
      console.log('Link click handler attached to preview');
      
      return () => {
        previewElement.removeEventListener('click', handleLinkClick);
      };
    }
  }, []);
  
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

  // Wrap the content with style tag
  const styledHtml = `
    <style>
      ${getStyleCSS(previewStyle)}
    </style>
    <div class="preview-content">
      ${renderedHtml}
    </div>
  `;

  return React.createElement('div', {
    ref: previewRef,
    className: 'preview',
    style: {
      padding: '15px',
      height: '100%',
      overflow: 'auto',
      backgroundColor: 'var(--preview-bg)',
      boxSizing: 'border-box',
      minWidth: 0 // Prevent flex shrinking issues
    },
    onScroll: handleScrollEvent,
    dangerouslySetInnerHTML: { __html: styledHtml }
  });
}

// File Explorer Component
const FileExplorer = React.forwardRef(({ currentFolder, onFileClick, onFolderChange }, ref) => {
  const [folderContents, setFolderContents] = useState([]);
  const [subfolderContents, setSubfolderContents] = useState(new Map());
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [showInputDialog, setShowInputDialog] = useState(null);
  
  // Internal refresh function
  const refreshExplorer = () => {
    if (currentFolder) {
      loadFolderContents(currentFolder);
      // Also refresh any expanded subfolders
      expandedFolders.forEach(folderPath => {
        loadSubfolderContents(folderPath);
      });
    }
  };

  // Expose refresh method to parent
  React.useImperativeHandle(ref, () => ({
    refresh: refreshExplorer
  }), [currentFolder, expandedFolders]);
  
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
  
  // Handle context menu
  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item: item
    });
  };
  
  // File operations
  const handleDuplicateFile = async (filePath) => {
    try {
      const result = await window.electronAPI.duplicateFile(filePath);
      if (result.success) {
        console.log('File duplicated:', result.path);
        // Refresh to show the new file
        refreshExplorer();
      } else {
        console.error('Failed to duplicate file:', result.error);
        alert(`Failed to duplicate file: ${result.error}`);
      }
    } catch (error) {
      console.error('Error duplicating file:', error);
      alert(`Error duplicating file: ${error.message}`);
    }
    setContextMenu(null);
  };
  
  const handleCreateNewFile = async (parentPath) => {
    setContextMenu(null);
    setShowInputDialog({
      type: 'file',
      parentPath: parentPath,
      title: 'Create New File',
      placeholder: 'Enter file name (e.g. document.md)'
    });
  };

  const processFileCreation = async (parentPath, fileName) => {
    if (!fileName) {
      return;
    }
    
    const filePath = `${parentPath}/${fileName}${fileName.endsWith('.md') ? '' : '.md'}`;
    const content = `# ${fileName.replace(/\.md$/, '')}\n\n`;
    
    try {
      // Actually create the file on disk
      const result = await window.electronAPI.writeFile(filePath, content);
      if (result.success) {
        
        // Create tab for the new file
        const newTab = {
          id: Date.now(),
          name: fileName.endsWith('.md') ? fileName : `${fileName}.md`,
          content: content,
          path: filePath,
          isDirty: false // File is saved, so not dirty
        };
        
        // Notify parent component to add the tab
        if (onFolderChange) {
          onFolderChange('new-file', newTab);
        }
        
        // Refresh to show the new file
        refreshExplorer();
      } else {
        console.error('Failed to create file:', result.error);
        alert(`Failed to create file: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating file:', error);
      alert(`Error creating file: ${error.message}`);
    }
    
    setContextMenu(null);
  };
  
  const handleCreateFolder = async (parentPath) => {
    setContextMenu(null);
    setShowInputDialog({
      type: 'folder',
      parentPath: parentPath,
      title: 'Create New Folder',
      placeholder: 'Enter folder name'
    });
  };

  const processFolderCreation = async (parentPath, folderName) => {
    if (!folderName) {
      return;
    }
    
    const newFolderPath = `${parentPath}/${folderName}`;
    try {
      const result = await window.electronAPI.createFolder(newFolderPath);
      if (result.success) {
        // Refresh to show the new folder
        refreshExplorer();
      } else {
        console.error('Failed to create folder:', result.error);
        alert(`Failed to create folder: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      alert(`Error creating folder: ${error.message}`);
    }
    setContextMenu(null);
  };
  
  const handleDeleteItem = async (item) => {
    const itemType = item.isDirectory ? 'folder' : 'file';
    const confirmResult = await window.electronAPI.showMessageBox({
      type: 'warning',
      buttons: ['Delete', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      message: `Delete ${itemType}?`,
      detail: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`
    });
    
    if (confirmResult.response === 0) {
      try {
        const result = await window.electronAPI.deleteItem(item.path);
        if (result.success) {
          console.log('Item deleted:', item.path);
          // Refresh to remove the deleted item
          refreshExplorer();
        } else {
          console.error('Failed to delete item:', result.error);
          alert(`Failed to delete ${itemType}: ${result.error}`);
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        alert(`Error deleting ${itemType}: ${error.message}`);
      }
    }
    setContextMenu(null);
  };
  
  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);
  
  const renderItem = (item, depth = 0) => {
    const isExpanded = expandedFolders.has(item.path);
    const paddingLeft = 8 + (depth * 16);
    
    if (item.isDirectory) {
      const contents = subfolderContents.get(item.path) || [];
      return React.createElement(React.Fragment, {
        key: item.path
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
            borderRadius: '3px',
            marginBottom: '2px'
          },
          onClick: () => toggleFolder(item.path),
          onContextMenu: (e) => handleContextMenu(e, item),
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
        onContextMenu: (e) => handleContextMenu(e, item),
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
        fontSize: '13px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }
    }, 
      React.createElement('div', {
        style: { marginBottom: '10px', fontSize: '24px' }
      }, '📁'),
      React.createElement('div', {
        style: { lineHeight: '1.5' }
      }, 'No folder selected'),
      React.createElement('div', {
        style: { fontSize: '11px', marginTop: '8px', opacity: 0.8 }
      }, 'Use File → Open Folder...')
    );
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
        folderContents.map(item => renderItem(item, 0))
    ),
    
    // Context menu
    contextMenu && React.createElement('div', {
      style: {
        position: 'fixed',
        left: contextMenu.x,
        top: contextMenu.y,
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000,
        minWidth: '150px',
        padding: '4px 0',
        fontSize: '13px'
      },
      onClick: (e) => e.stopPropagation()
    },
      contextMenu.item.isDirectory ? [
        React.createElement('div', {
          key: 'new-file',
          style: {
            padding: '8px 16px',
            cursor: 'pointer',
            color: '#333'
          },
          onClick: () => {
            handleCreateNewFile(contextMenu.item.path);
          },
          onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
          onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
        }, '📄 New File'),
        React.createElement('div', {
          key: 'new-folder',
          style: {
            padding: '8px 16px',
            cursor: 'pointer',
            color: '#333'
          },
          onClick: () => {
            handleCreateFolder(contextMenu.item.path);
          },
          onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
          onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
        }, '📁 New Folder'),
        React.createElement('div', {
          key: 'separator1',
          style: {
            height: '1px',
            backgroundColor: '#eee',
            margin: '4px 0'
          }
        }),
        React.createElement('div', {
          key: 'rename',
          style: {
            padding: '8px 16px',
            cursor: 'pointer',
            color: '#333'
          },
          onClick: () => {
            showInputDialog('Rename Folder', 'Enter new name:', contextMenu.item.name, (newName) => {
              if (newName && newName !== contextMenu.item.name) {
                const oldPath = contextMenu.item.path;
                const parentDir = oldPath.substring(0, oldPath.lastIndexOf('/'));
                const newPath = parentDir + '/' + newName;
                window.electronAPI.renameItem(oldPath, newPath).then(() => {
                  refreshExplorer();
                  showStatusMessage(`Renamed folder to ${newName}`);
                }).catch(err => {
                  showStatusMessage(`Error renaming folder: ${err.message}`, 'error');
                });
              }
            });
          },
          onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
          onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
        }, '✏️ Rename'),
        React.createElement('div', {
          key: 'copy-path',
          style: {
            padding: '8px 16px',
            cursor: 'pointer',
            color: '#333'
          },
          onClick: () => {
            navigator.clipboard.writeText(contextMenu.item.path);
            showStatusMessage('Path copied to clipboard');
          },
          onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
          onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
        }, '📋 Copy Path'),
        React.createElement('div', {
          key: 'separator2',
          style: {
            height: '1px',
            backgroundColor: '#eee',
            margin: '4px 0'
          }
        }),
        React.createElement('div', {
          key: 'delete',
          style: {
            padding: '8px 16px',
            cursor: 'pointer',
            color: '#d32f2f'
          },
          onClick: () => handleDeleteItem(contextMenu.item),
          onMouseEnter: (e) => e.target.style.backgroundColor = '#ffebee',
          onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
        }, '🗑️ Delete Folder')
      ] : [
        React.createElement('div', {
          key: 'duplicate',
          style: {
            padding: '8px 16px',
            cursor: 'pointer',
            color: '#333'
          },
          onClick: () => handleDuplicateFile(contextMenu.item.path),
          onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
          onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
        }, '📋 Duplicate'),
        React.createElement('div', {
          key: 'rename',
          style: {
            padding: '8px 16px',
            cursor: 'pointer',
            color: '#333'
          },
          onClick: () => {
            const fileExtension = contextMenu.item.name.includes('.') ? contextMenu.item.name.substring(contextMenu.item.name.lastIndexOf('.')) : '';
            const baseName = contextMenu.item.name.includes('.') ? contextMenu.item.name.substring(0, contextMenu.item.name.lastIndexOf('.')) : contextMenu.item.name;
            showInputDialog('Rename File', 'Enter new name:', baseName, (newName) => {
              if (newName) {
                const fullName = newName + fileExtension;
                if (fullName !== contextMenu.item.name) {
                  const oldPath = contextMenu.item.path;
                  const parentDir = oldPath.substring(0, oldPath.lastIndexOf('/'));
                  const newPath = parentDir + '/' + fullName;
                  window.electronAPI.renameItem(oldPath, newPath).then(() => {
                    refreshExplorer();
                    showStatusMessage(`Renamed file to ${fullName}`);
                  }).catch(err => {
                    showStatusMessage(`Error renaming file: ${err.message}`, 'error');
                  });
                }
              }
            });
          },
          onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
          onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
        }, '✏️ Rename'),
        React.createElement('div', {
          key: 'copy-path',
          style: {
            padding: '8px 16px',
            cursor: 'pointer',
            color: '#333'
          },
          onClick: () => {
            navigator.clipboard.writeText(contextMenu.item.path);
            showStatusMessage('Path copied to clipboard');
          },
          onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
          onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
        }, '📋 Copy Path'),
        React.createElement('div', {
          key: 'copy-name',
          style: {
            padding: '8px 16px',
            cursor: 'pointer',
            color: '#333'
          },
          onClick: () => {
            navigator.clipboard.writeText(contextMenu.item.name);
            showStatusMessage('Filename copied to clipboard');
          },
          onMouseEnter: (e) => e.target.style.backgroundColor = '#f0f0f0',
          onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
        }, '📋 Copy Name'),
        React.createElement('div', {
          key: 'separator',
          style: {
            height: '1px',
            backgroundColor: '#eee',
            margin: '4px 0'
          }
        }),
        React.createElement('div', {
          key: 'delete',
          style: {
            padding: '8px 16px',
            cursor: 'pointer',
            color: '#d32f2f'
          },
          onClick: () => handleDeleteItem(contextMenu.item),
          onMouseEnter: (e) => e.target.style.backgroundColor = '#ffebee',
          onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent'
        }, '🗑️ Delete File')
      ]
    ),
    
    // Input Dialog
    showInputDialog && React.createElement('div', {
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      },
      onClick: (e) => {
        if (e.target === e.currentTarget) {
          setShowInputDialog(null);
        }
      }
    },
      React.createElement('div', {
        style: {
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          minWidth: '300px',
          maxWidth: '400px'
        }
      },
        React.createElement('h3', {
          style: { margin: '0 0 15px 0', color: '#333' }
        }, showInputDialog.title),
        React.createElement('input', {
          type: 'text',
          placeholder: showInputDialog.placeholder,
          autoFocus: true,
          style: {
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            marginBottom: '15px'
          },
          onKeyDown: (e) => {
            if (e.key === 'Enter') {
              const value = e.target.value.trim();
              if (value) {
                if (showInputDialog.type === 'file') {
                  processFileCreation(showInputDialog.parentPath, value);
                } else if (showInputDialog.type === 'folder') {
                  processFolderCreation(showInputDialog.parentPath, value);
                }
              }
              setShowInputDialog(null);
            } else if (e.key === 'Escape') {
              setShowInputDialog(null);
            }
          }
        }),
        React.createElement('div', {
          style: {
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end'
          }
        },
          React.createElement('button', {
            onClick: () => setShowInputDialog(null),
            style: {
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer'
            }
          }, 'Cancel'),
          React.createElement('button', {
            onClick: (e) => {
              const input = e.target.parentElement.parentElement.querySelector('input');
              const value = input.value.trim();
              if (value) {
                if (showInputDialog.type === 'file') {
                  processFileCreation(showInputDialog.parentPath, value);
                } else if (showInputDialog.type === 'folder') {
                  processFolderCreation(showInputDialog.parentPath, value);
                }
              }
              setShowInputDialog(null);
            },
            style: {
              padding: '6px 12px',
              border: '1px solid #007acc',
              borderRadius: '4px',
              backgroundColor: '#007acc',
              color: '#fff',
              cursor: 'pointer'
            }
          }, 'Create')
        )
      )
    )
  );
});

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
      
      // Preview Style Setting
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
        }, 'Preview Style'),
        React.createElement('select', {
          value: localPrefs.previewStyle || 'standard',
          onChange: (e) => setLocalPrefs(prev => ({
            ...prev,
            previewStyle: e.target.value
          })),
          style: {
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--border-medium)',
            borderRadius: '4px',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '14px'
          }
        },
          getStyleNames().map(style =>
            React.createElement('option', {
              key: style.value,
              value: style.value
            }, style.label)
          )
        ),
        React.createElement('div', {
          style: {
            marginTop: '8px',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }
        }, 'Choose how your markdown preview and printed documents will appear')
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
  
  
  // Get current tab
  const currentTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
  
  // Helper function to get a more informative tab title
  const getTabDisplayName = (tab) => {
    if (!tab.path) return tab.name;
    
    // Check if there are other tabs with the same filename
    const sameName = tabs.filter(t => t.name === tab.name && t.path);
    if (sameName.length <= 1) return tab.name;
    
    // If multiple files have the same name, show parent directory
    const pathParts = tab.path.split('/');
    if (pathParts.length >= 2) {
      const parentDir = pathParts[pathParts.length - 2];
      return `${parentDir}/${tab.name}`;
    }
    
    return tab.name;
  };
  
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
  
  // Editor ref for formatting functions
  const editorRef = useRef(null);
  
  // File explorer ref for refresh
  const fileExplorerRef = useRef(null);
  
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
  
  // Formatting handler for Toolbar
  const handleFormat = (action, ...args) => {
    if (!editorRef.current || !editorRef.current.formatText) {
      console.warn('Editor ref not available for formatting');
      return;
    }
    
    try {
      editorRef.current.formatText(action, ...args);
    } catch (error) {
      console.error('Formatting error:', error);
      setStatus(`✗ Formatting error: ${error.message}`);
    }
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
            // Refresh file explorer to show updated file
            if (fileExplorerRef.current) {
              fileExplorerRef.current.refresh();
            }
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
            // Refresh file explorer to show new file
            if (fileExplorerRef.current) {
              fileExplorerRef.current.refresh();
            }
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
    
    // Helper function to get current theme selection
    const getCurrentThemeStyle = async () => {
      console.log('getCurrentThemeStyle: Starting theme detection...');
      
      // Method 1: Check DOM dropdown (most current UI state)
      const dropdownElement = document.querySelector('select[title="Select preview style"]');
      const domValue = dropdownElement ? dropdownElement.value : null;
      console.log('getCurrentThemeStyle: DOM dropdown value:', domValue);
      
      // Method 2: Check React state 
      const stateValue = preferences.previewStyle;
      console.log('getCurrentThemeStyle: React state value:', stateValue);
      
      // Method 3: Try to get from electron preferences directly
      let electronPrefsValue = null;
      try {
        const electronPrefs = await window.electronAPI.preferencesLoad();
        electronPrefsValue = electronPrefs.previewStyle;
        console.log('getCurrentThemeStyle: Electron prefs value:', electronPrefsValue);
      } catch (error) {
        console.log('getCurrentThemeStyle: Could not load electron prefs:', error);
      }
      
      // Prioritize: DOM > Electron prefs > React state > default
      const finalValue = domValue || electronPrefsValue || stateValue || 'standard';
      console.log('getCurrentThemeStyle: Final selected value:', finalValue);
      
      return finalValue;
    };

    // Export handlers
    const handleExportPDF = async () => {
      console.log('=== RENDERER: handleExportPDF CALLED ===');
      console.log('App: Export PDF requested');
      const current = currentTabRef.current;
      if (!current.content.trim()) {
        setStatus('✗ No content to export');
        return;
      }
      
      setStatus('Exporting to PDF...');
      try {
        // Get the current theme selection - use live dropdown value
        const selectedStyle = await getCurrentThemeStyle();
        const cssContent = getStyleCSS(selectedStyle);
        console.log('PDF Export: Using theme style:', selectedStyle);
        console.log('PDF Export: CSS content preview (first 200 chars):', cssContent.substring(0, 200));
        console.log('PDF Export: CSS contains monospace fonts?', cssContent.includes('monospace'));
        console.log('PDF Export: CSS contains blue color?', cssContent.includes('#0066cc'));
        
        // Debug: Test getStyleCSS directly with different values
        console.log('DEBUG: getStyleCSS("standard") preview:', getStyleCSS('standard').substring(0, 100));
        console.log('DEBUG: getStyleCSS("technical") preview:', getStyleCSS('technical').substring(0, 100));
        console.log('DEBUG: Technical theme contains monospace?', getStyleCSS('technical').includes('monospace'));
        
        const result = await window.electronAPI.exportPDF({
          markdown: current.content,
          title: current.name || 'document',
          styleCSS: cssContent
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
        const selectedStyle = await getCurrentThemeStyle();
        console.log('HTML Export: Using theme style:', selectedStyle);
        
        const result = await window.electronAPI.exportHTML({
          markdown: current.content,
          title: current.name || 'document',
          styleCSS: getStyleCSS(selectedStyle)
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
        const selectedStyle = await getCurrentThemeStyle();
        console.log('EPUB Export: Using theme style:', selectedStyle);
        
        const result = await window.electronAPI.exportEPUB({
          markdown: current.content,
          title: current.name || 'document',
          author: 'willisMD User',
          styleCSS: getStyleCSS(selectedStyle)
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
        const selectedStyle = await getCurrentThemeStyle();
        console.log('DOCX Export: Using theme style:', selectedStyle);
        
        const result = await window.electronAPI.exportDOCX({
          markdown: current.content,
          title: current.name || 'document',
          styleCSS: getStyleCSS(selectedStyle)
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
    
    // Print handler
    const handlePrint = async () => {
      console.log('App: Print requested');
      const current = currentTabRef.current;
      if (!current.content.trim()) {
        setStatus('✗ No content to print');
        return;
      }
      
      setStatus('Preparing to print...');
      try {
        // Convert markdown to HTML for printing (same process as preview)
        const processWikiLinks = (text) => {
          if (!text) return text;
          
          // Regex to match [[filename]] patterns
          const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
          
          return text.replace(wikiLinkRegex, (match, filename) => {
            // Clean the filename and create a clickable link
            const cleanFilename = filename.trim();
            return `<a href="#" class="wiki-link" data-filename="${cleanFilename}">${cleanFilename}</a>`;
          });
        };
        
        const processedContent = processWikiLinks(current.content);
        const html = marked(processedContent);
        
        const selectedStyle = await getCurrentThemeStyle();
        console.log('Print: Using theme style:', selectedStyle);
        
        const result = await window.electronAPI.printPreview({
          html: html,
          title: current.name || 'document',
          styleCSS: getStyleCSS(selectedStyle)
        });
        
        if (result.success) {
          setStatus('✓ Print dialog opened');
        } else {
          setStatus(`✗ Print failed: ${result.error}`);
        }
      } catch (error) {
        setStatus(`✗ Print error: ${error.message}`);
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
        const unsavedTabs = currentTabs.filter(tab => tab.isDirty);
        
        console.log(`App: Found ${unsavedTabs.length} unsaved tabs`);
        
        // First check if any tabs need save dialog (no path)
        const tabsWithoutPath = unsavedTabs.filter(tab => !tab.path);
        if (tabsWithoutPath.length > 0) {
          // We have unsaved new files - for now, just notify and cancel quit
          console.log('Found tabs without paths, canceling quit');
          const message = tabsWithoutPath.length === 1 
            ? `The file "${tabsWithoutPath[0].name}" has not been saved. Please save it before quitting.`
            : `${tabsWithoutPath.length} files have not been saved. Please save them before quitting.`;
          
          await window.electronAPI.showMessageBox({
            type: 'warning',
            title: 'Unsaved Files',
            message: message,
            buttons: ['OK']
          });
          
          // Don't send save-all-complete to cancel the quit
          return;
        }
        
        // Save all tabs that have paths
        for (const tab of unsavedTabs) {
          if (tab.path) {
            console.log(`Saving tab: ${tab.name} to ${tab.path}`);
            try {
              const result = await window.electronAPI.writeFile(tab.path, tab.content);
              if (!result.success) {
                console.error(`Failed to save ${tab.name}:`, result.error);
              } else {
                console.log(`Successfully saved: ${tab.name}`);
              }
            } catch (saveError) {
              console.error(`Error saving ${tab.name}:`, saveError);
            }
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
      console.log('=== SETTING UP onExportPDF LISTENER ===');
      window.electronAPI.onExportPDF((event) => {
        console.log('=== onExportPDF EVENT RECEIVED ===', event);
        handleExportPDF();
      });
      window.electronAPI.onExportHTML(handleExportHTML);
      window.electronAPI.onExportEPUB(handleExportEPUB);
      window.electronAPI.onExportDOCX(handleExportDOCX);
      window.electronAPI.onPrint(handlePrint);
      window.electronAPI.onShowPreferences(handleShowPreferences);
      console.log('App: Registering onShowAbout listener');
      window.electronAPI.onShowAbout(handleShowAbout);
      console.log('App: onShowAbout listener registered');
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
      window.electronAPI.removeAllListeners('menu-print');
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

  const handleContentChange = React.useCallback((newContent) => {
    // Use React 18's automatic batching for better performance
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, content: newContent, isDirty: true } : tab
    ));
  }, [activeTabId]);
  
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
    
    if (tabs.length === 1) {
      // If closing the last tab, create a new empty tab
      const newTab = {
        id: Date.now(),
        name: 'Untitled.md',
        content: '# New Document\n\n',
        path: null,
        isDirty: false
      };
      setTabs([newTab]);
      setActiveTabId(newTab.id);
      setStatus(`Closed: ${tabToClose.name}`);
    } else {
      // Normal close behavior for multiple tabs
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
  
  // Handle wiki link clicks
  const handleWikiLinkClick = async (filename) => {
    console.log('Wiki link clicked:', filename);
    
    // Get the directory of the current file
    const currentTab = tabsRef.current.find(tab => tab.id === activeTabId);
    if (!currentTab || !currentTab.path) {
      setStatus('✗ Current file must be saved to resolve wiki links');
      return;
    }
    
    // Extract directory from current file path
    const currentFileDir = currentTab.path.substring(0, currentTab.path.lastIndexOf('/'));
    console.log('Current file directory:', currentFileDir);
    
    try {
      // Try to resolve the filename to a full path
      const resolvedPath = await resolveWikiLink(filename, currentFileDir);
      
      if (resolvedPath) {
        // File exists, open it
        handleExplorerFileClick(resolvedPath);
      } else {
        // File doesn't exist, ask if user wants to create it
        const shouldCreate = await window.electronAPI.showMessageBox({
          type: 'question',
          buttons: ['Create File', 'Cancel'],
          defaultId: 0,
          message: `File "${filename}" not found`,
          detail: `Would you like to create "${filename}.md" in the same directory as the current file?`
        });
        
        if (shouldCreate.response === 0) {
          // Create new file in the same directory as current file
          const newFilePath = `${currentFileDir}/${filename}.md`;
          const newTab = {
            id: Date.now(),
            name: `${filename}.md`,
            content: `# ${filename}\n\n`,
            path: newFilePath,
            isDirty: true
          };
          setTabs(prev => [...prev, newTab]);
          setActiveTabId(newTab.id);
          setStatus(`✓ Created new file: ${filename}.md`);
          // Note: File explorer will refresh when the file is saved
        }
      }
    } catch (error) {
      console.error('Error resolving wiki link:', error);
      setStatus(`✗ Error resolving wiki link: ${error.message}`);
    }
  };
  
  // Resolve wiki link filename to full path
  const resolveWikiLink = async (filename, folderPath) => {
    try {
      const result = await window.electronAPI.readDirectory(folderPath);
      if (!result.success) return null;
      
      const files = result.items.filter(item => item.isFile);
      
      // Try exact match first
      let match = files.find(file => file.name === filename);
      if (match) return match.path;
      
      // Try with .md extension
      match = files.find(file => file.name === `${filename}.md`);
      if (match) return match.path;
      
      // Try with .markdown extension
      match = files.find(file => file.name === `${filename}.markdown`);
      if (match) return match.path;
      
      // Try case insensitive match
      const lowerFilename = filename.toLowerCase();
      match = files.find(file => 
        file.name.toLowerCase() === lowerFilename ||
        file.name.toLowerCase() === `${lowerFilename}.md` ||
        file.name.toLowerCase() === `${lowerFilename}.markdown`
      );
      if (match) return match.path;
      
      return null; // No match found
    } catch (error) {
      console.error('Error reading directory for wiki link:', error);
      return null;
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
  
  // Toolbar wrapper functions for file operations
  const handleToolbarCreateFile = async () => {
    if (currentFolder) {
      const fileName = prompt('Enter file name:');
      if (fileName) {
        const filePath = `${currentFolder}/${fileName}${fileName.endsWith('.md') ? '' : '.md'}`;
        const content = `# ${fileName.replace(/\.md$/, '')}\n\n`;
        
        try {
          // Actually create the file on disk
          const result = await window.electronAPI.writeFile(filePath, content);
          if (result.success) {
            
            const newTab = {
              id: Date.now(),
              name: fileName.endsWith('.md') ? fileName : `${fileName}.md`,
              content: content,
              path: filePath,
              isDirty: false
            };
            setTabs(prev => [...prev, newTab]);
            setActiveTabId(newTab.id);
            setStatus(`✓ New file created: ${newTab.name}`);
            
            // Refresh file explorer
            if (fileExplorerRef.current) {
              fileExplorerRef.current.refresh();
            }
          } else {
            console.error('Toolbar: Failed to create file:', result.error);
            setStatus(`✗ Failed to create file: ${result.error}`);
          }
        } catch (error) {
          console.error('Toolbar: Error creating file:', error);
          setStatus(`✗ Error creating file: ${error.message}`);
        }
      }
    }
  };
  
  const handleToolbarCreateFolder = async () => {
    if (currentFolder) {
      const folderName = prompt('Enter folder name:');
      if (folderName) {
        const newFolderPath = `${currentFolder}/${folderName}`;
        try {
          const result = await window.electronAPI.createFolder(newFolderPath);
          if (result.success) {
                setStatus(`✓ Folder created: ${folderName}`);
            // Refresh file explorer to show new folder
            if (fileExplorerRef.current) {
              fileExplorerRef.current.refresh();
            }
          } else {
            console.error('Failed to create folder:', result.error);
            setStatus(`✗ Failed to create folder: ${result.error}`);
          }
        } catch (error) {
          console.error('Error creating folder:', error);
          setStatus(`✗ Error creating folder: ${error.message}`);
        }
      }
    }
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

  // No need for content loading effect - editor recreates on tab change via key prop

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
          },
          title: tab.path || tab.name // Show full path as tooltip
        }, `${getTabDisplayName(tab)}${tab.isDirty ? ' •' : ''}`),
        React.createElement('button', {
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
    
    
    // Main content area with file explorer
    React.createElement('div', {
      style: {
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }
    },
      // File Explorer (left sidebar)
      isExplorerVisible && React.createElement('div', {
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
            borderBottom: '1px solid var(--border-light)'
          }
        }, 
          React.createElement('div', {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '5px'
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
          // Explorer toolbar
          currentFolder && React.createElement('div', {
            style: {
              display: 'flex',
              gap: '4px',
              padding: '4px 0'
            }
          },
            React.createElement('button', {
              style: {
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '3px',
                fontSize: '14px',
                color: 'var(--text-secondary)'
              },
              onClick: () => {
                handleToolbarCreateFile();
              },
              onMouseEnter: (e) => e.target.style.backgroundColor = 'var(--bg-accent)',
              onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent',
              title: 'New File'
            }, '📄'),
            React.createElement('button', {
              style: {
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '3px',
                fontSize: '14px',
                color: 'var(--text-secondary)'
              },
              onClick: () => {
                handleToolbarCreateFolder();
              },
              onMouseEnter: (e) => e.target.style.backgroundColor = 'var(--bg-accent)',
              onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent',
              title: 'New Folder'
            }, '📁'),
            React.createElement('button', {
              style: {
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '3px',
                fontSize: '14px',
                color: 'var(--text-secondary)'
              },
              onClick: () => {
                if (fileExplorerRef.current) {
                  fileExplorerRef.current.refresh();
                }
              },
              onMouseEnter: (e) => e.target.style.backgroundColor = 'var(--bg-accent)',
              onMouseLeave: (e) => e.target.style.backgroundColor = 'transparent',
              title: 'Refresh Explorer'
            }, '🔄')
          )
        ),
        React.createElement(FileExplorer, {
          ref: fileExplorerRef,
          currentFolder: currentFolder,
          onFileClick: handleExplorerFileClick,
          onFolderChange: (action, data) => {
            if (action === 'new-file') {
              setTabs(prev => [...prev, data]);
              setActiveTabId(data.id);
            }
          }
        })
      ),
      
      // Splitter between explorer and editor
      isExplorerVisible && React.createElement(Splitter, {
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
              // Explorer toggle (always visible)
              React.createElement('button', {
                style: {
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: isExplorerVisible ? '#007acc' : '#666',
                  padding: '2px 4px'
                },
                onClick: toggleExplorer,
                title: isExplorerVisible ? 'Hide Explorer' : 'Show Explorer'
              }, '📁'),
              // Preview toggle
              React.createElement('button', {
                style: {
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: isPreviewVisible ? '#007acc' : '#666',
                  padding: '2px 4px'
                },
                onClick: togglePreview,
                title: isPreviewVisible ? 'Hide Preview' : 'Show Preview'
              }, isPreviewVisible ? '👁️‍🗨️' : '👁️')
            )
          ),
          // Toolbar
          React.createElement(Toolbar, {
            onFormat: handleFormat
          }),
          React.createElement('div', {
            style: { 
              position: 'relative', 
              height: '100%', 
              overflow: 'hidden',
              flex: 1
            }
          },
            React.createElement(CodeMirrorEditor, {
              ref: editorRef,
              key: activeTabId, // Force new instance when tab changes
              initialContent: currentTab.content,
              onChange: handleContentChange,
              theme: preferences.theme || 'light',
              onScroll: handleScroll,
              scrollToPercentage: lastScrollSource === 'preview' ? editorScrollPercentage : null
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
            React.createElement('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }
            },
              // Style selector dropdown
              React.createElement('select', {
                value: preferences.previewStyle || 'standard',
                onChange: async (e) => {
                  const newStyle = e.target.value;
                  const updatedPrefs = { ...preferences, previewStyle: newStyle };
                  setPreferences(updatedPrefs);
                  
                  // Save to persistent storage
                  try {
                    await window.electronAPI.preferencesSave(updatedPrefs);
                  } catch (error) {
                    console.error('Failed to save preferences:', error);
                  }
                },
                style: {
                  fontSize: '11px',
                  padding: '2px 4px',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                },
                title: 'Select preview style'
              },
                getStyleNames().map(style =>
                  React.createElement('option', {
                    key: style.value,
                    value: style.value
                  }, style.label)
                )
              ),
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
            )
          ),
          React.createElement(Preview, {
            content: currentTab.content,
            onScroll: handleScroll,
            scrollToPercentage: lastScrollSource === 'editor' ? previewScrollPercentage : null,
            currentFileDir: currentTab.path ? currentTab.path.substring(0, currentTab.path.lastIndexOf('/')) : null,
            onWikiLinkClick: handleWikiLinkClick,
            previewStyle: preferences.previewStyle || 'standard'
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