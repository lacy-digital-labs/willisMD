import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine, highlightSelectionMatches } from '@codemirror/view';
import { EditorState, Annotation } from '@codemirror/state';
import { defaultHighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { history, defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches as searchHighlight } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { githubLight } from '@uiw/codemirror-theme-github';
import './CodeMirrorEditor.css';

// Create an annotation for formatting operations
const formattingAnnotation = Annotation.define();

const CodeMirrorEditor = forwardRef(({ initialContent = '', onChange, theme = 'light', onScroll, scrollToPercentage }, ref) => {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const isScrollingRef = useRef(false);
  const editorStateRef = useRef(null);

  // Table modification helper function
  const handleTableModification = (view, action, from, to) => {
    const { state } = view;
    const doc = state.doc;
    
    // Find the table that contains the cursor
    const currentLine = state.doc.lineAt(from);
    let tableStart = null;
    let tableEnd = null;
    let tableLines = [];
    
    // Find start of table (look backwards for first table row)
    for (let lineNum = currentLine.number; lineNum >= 1; lineNum--) {
      const line = doc.line(lineNum);
      if (line.text.trim().startsWith('|') && line.text.trim().endsWith('|')) {
        tableStart = lineNum;
      } else if (tableStart !== null) {
        break;
      }
    }
    
    // Find end of table (look forwards for last table row)
    if (tableStart !== null) {
      for (let lineNum = tableStart; lineNum <= doc.lines; lineNum++) {
        const line = doc.line(lineNum);
        if (line.text.trim().startsWith('|') && line.text.trim().endsWith('|')) {
          tableEnd = lineNum;
          tableLines.push({
            number: lineNum,
            text: line.text,
            from: line.from,
            to: line.to
          });
        } else {
          break;
        }
      }
    }
    
    if (tableStart === null || tableEnd === null || tableLines.length < 2) {
      console.warn('No table found at cursor position');
      return;
    }
    
    // Parse table structure
    const headerRow = tableLines[0];
    const separatorRow = tableLines[1];
    const dataRows = tableLines.slice(2);
    
    // Count columns from header
    const headerCells = headerRow.text.split('|').filter(cell => cell.trim() !== '');
    const colCount = headerCells.length;
    
    // Find current row and column
    const currentRowIndex = tableLines.findIndex(line => 
      from >= line.from && from <= line.to
    );
    const currentRow = tableLines[currentRowIndex];
    
    let newTableText = '';
    
    switch (action) {
      case 'table-add-row-after':
        // Add empty row after current row
        const emptyRow = '|' + ' '.repeat(15) + '|'.repeat(colCount - 1) + '\n';
        tableLines.splice(currentRowIndex + 1, 0, {
          text: emptyRow.trim(),
          isNew: true
        });
        break;
        
      case 'table-add-row-before':
        // Add empty row before current row
        const emptyRowBefore = '|' + ' '.repeat(15) + '|'.repeat(colCount - 1) + '\n';
        tableLines.splice(currentRowIndex, 0, {
          text: emptyRowBefore.trim(),
          isNew: true
        });
        break;
        
      case 'table-delete-row':
        // Don't delete header or separator rows
        if (currentRowIndex > 1 && tableLines.length > 3) {
          tableLines.splice(currentRowIndex, 1);
        }
        break;
        
      case 'table-add-column-after':
      case 'table-add-column-before':
        // Find which column the cursor is in
        const cursorOffsetCol = from - currentRow.from;
        const beforeCursorCol = currentRow.text.substring(0, cursorOffsetCol);
        const currentColumnIndex = Math.max(0, (beforeCursorCol.match(/\|/g) || []).length - 1);
        
        // Add column to all rows at the correct position
        tableLines.forEach((line, index) => {
          const cells = line.text.split('|').filter((cell, i) => i > 0 && i < line.text.split('|').length - 1);
          const insertIndex = action === 'table-add-column-after' ? currentColumnIndex + 1 : currentColumnIndex;
          
          if (index === 0) {
            // Header row
            cells.splice(insertIndex, 0, ' New Header ');
          } else if (index === 1) {
            // Separator row
            cells.splice(insertIndex, 0, '----------');
          } else {
            // Data row
            cells.splice(insertIndex, 0, ' New Cell ');
          }
          line.text = '|' + cells.join('|') + '|';
        });
        break;
        
      case 'table-delete-column':
        // Don't delete if only one column left
        if (colCount > 1) {
          // Find which column the cursor is in
          const cursorOffset = from - currentRow.from;
          const beforeCursor = currentRow.text.substring(0, cursorOffset);
          const columnIndex = (beforeCursor.match(/\|/g) || []).length - 1;
          
          if (columnIndex >= 0) {
            tableLines.forEach(line => {
              const cells = line.text.split('|').filter((cell, i) => i > 0 && i < line.text.split('|').length - 1);
              if (cells.length > columnIndex) {
                cells.splice(columnIndex, 1);
                line.text = '|' + cells.join('|') + '|';
              }
            });
          }
        }
        break;
        
      case 'table-align-left':
      case 'table-align-center':
      case 'table-align-right':
        // Modify separator row to change alignment
        const separatorCells = separatorRow.text.split('|').filter((cell, i) => i > 0 && i < separatorRow.text.split('|').length - 1);
        const cursorOffsetAlign = from - currentRow.from;
        const beforeCursorAlign = currentRow.text.substring(0, cursorOffsetAlign);
        const columnIndexAlign = (beforeCursorAlign.match(/\|/g) || []).length - 1;
        
        if (columnIndexAlign >= 0 && columnIndexAlign < separatorCells.length) {
          let newSeparator = '----------';
          if (action === 'table-align-left') {
            newSeparator = ':----------';
          } else if (action === 'table-align-center') {
            newSeparator = ':---------:';
          } else if (action === 'table-align-right') {
            newSeparator = '----------:';
          }
          separatorCells[columnIndexAlign] = newSeparator;
          tableLines[1].text = '|' + separatorCells.join('|') + '|';
        }
        break;
    }
    
    // Reconstruct table text
    newTableText = tableLines.map(line => line.text).join('\n');
    
    // Replace the entire table
    const tableStartPos = doc.line(tableStart).from;
    const tableEndPos = doc.line(tableEnd).to;
    
    // Calculate new cursor position relative to table start
    const originalOffset = from - tableStartPos;
    const newCursorPos = tableStartPos + Math.min(originalOffset, newTableText.length);
    
    view.dispatch({
      changes: {
        from: tableStartPos,
        to: tableEndPos,
        insert: newTableText
      },
      selection: { anchor: newCursorPos, head: newCursorPos },
      annotations: formattingAnnotation.of(true)
    });
  };

  // Expose formatting methods to parent component
  useImperativeHandle(ref, () => ({
    loadContent: (newContent) => {
      if (!viewRef.current) return;
      
      const currentContent = viewRef.current.state.doc.toString();
      if (newContent === currentContent) return;
      
      console.log('Loading new content into editor');
      
      // Replace entire content
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: newContent
        }
      });
    },
    getContent: () => {
      if (!viewRef.current) return '';
      return viewRef.current.state.doc.toString();
    },
    formatText: (action, ...args) => {
      if (!viewRef.current) return;
      
      const view = viewRef.current;
      const { state } = view;
      const { selection } = state;
      const from = selection.main.from;
      const to = selection.main.to;
      const selectedText = state.doc.sliceString(from, to);
      
      let newText = '';
      let newSelection = { anchor: from, head: to };
      
      switch (action) {
        case 'bold':
          if (selectedText) {
            newText = `**${selectedText}**`;
            newSelection = { anchor: from, head: from + newText.length };
          } else {
            newText = '**bold text**';
            newSelection = { anchor: from + 2, head: from + 11 };
          }
          break;
          
        case 'italic':
          if (selectedText) {
            newText = `*${selectedText}*`;
            newSelection = { anchor: from, head: from + newText.length };
          } else {
            newText = '*italic text*';
            newSelection = { anchor: from + 1, head: from + 12 };
          }
          break;
          
        case 'code':
          if (selectedText) {
            newText = `\`${selectedText}\``;
            newSelection = { anchor: from, head: from + newText.length };
          } else {
            newText = '`code`';
            newSelection = { anchor: from + 1, head: from + 5 };
          }
          break;
          
        case 'strikethrough':
          if (selectedText) {
            newText = `~~${selectedText}~~`;
            newSelection = { anchor: from, head: from + newText.length };
          } else {
            newText = '~~strikethrough text~~';
            newSelection = { anchor: from + 2, head: from + 19 };
          }
          break;
          
        case 'codeblock':
          if (selectedText) {
            newText = `\`\`\`\n${selectedText}\n\`\`\``;
            newSelection = { anchor: from, head: from + newText.length };
          } else {
            newText = '```\ncode block\n```';
            newSelection = { anchor: from + 4, head: from + 14 };
          }
          break;
          
        case 'h1':
          const line1 = state.doc.lineAt(from);
          const lineText1 = line1.text;
          newText = lineText1.startsWith('#') ? lineText1.replace(/^#+\s*/, '# ') : `# ${lineText1}`;
          view.dispatch({
            changes: { from: line1.from, to: line1.to, insert: newText },
            selection: { anchor: line1.from + newText.length },
            annotations: formattingAnnotation.of(true)
          });
          return;
          
        case 'h2':
          const line2 = state.doc.lineAt(from);
          const lineText2 = line2.text;
          newText = lineText2.startsWith('#') ? lineText2.replace(/^#+\s*/, '## ') : `## ${lineText2}`;
          view.dispatch({
            changes: { from: line2.from, to: line2.to, insert: newText },
            selection: { anchor: line2.from + newText.length },
            annotations: formattingAnnotation.of(true)
          });
          return;
          
        case 'h3':
          const line3 = state.doc.lineAt(from);
          const lineText3 = line3.text;
          newText = lineText3.startsWith('#') ? lineText3.replace(/^#+\s*/, '### ') : `### ${lineText3}`;
          view.dispatch({
            changes: { from: line3.from, to: line3.to, insert: newText },
            selection: { anchor: line3.from + newText.length },
            annotations: formattingAnnotation.of(true)
          });
          return;
          
        case 'ul':
          // Handle multiple lines for lists
          const startLine = state.doc.lineAt(from);
          const endLine = state.doc.lineAt(to);
          const changes = [];
          
          for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
            const line = state.doc.line(lineNum);
            const lineText = line.text;
            const newLineText = lineText.startsWith('- ') ? lineText.replace(/^- /, '') : `- ${lineText}`;
            changes.push({
              from: line.from,
              to: line.to,
              insert: newLineText
            });
          }
          
          view.dispatch({
            changes: changes,
            selection: { anchor: from, head: to },
            annotations: formattingAnnotation.of(true)
          });
          return;
          
        case 'ol':
          // Handle multiple lines for numbered lists
          const startLineOl = state.doc.lineAt(from);
          const endLineOl = state.doc.lineAt(to);
          const changesOl = [];
          let counter = 1;
          
          for (let lineNum = startLineOl.number; lineNum <= endLineOl.number; lineNum++) {
            const line = state.doc.line(lineNum);
            const lineText = line.text;
            const newLineText = lineText.match(/^\d+\. /) ? lineText.replace(/^\d+\. /, '') : `${counter}. ${lineText}`;
            changesOl.push({
              from: line.from,
              to: line.to,
              insert: newLineText
            });
            counter++;
          }
          
          view.dispatch({
            changes: changesOl,
            selection: { anchor: from, head: to },
            annotations: formattingAnnotation.of(true)
          });
          return;
          
        case 'quote':
          // Handle multiple lines for quotes
          const startLineQuote = state.doc.lineAt(from);
          const endLineQuote = state.doc.lineAt(to);
          const changesQuote = [];
          
          for (let lineNum = startLineQuote.number; lineNum <= endLineQuote.number; lineNum++) {
            const line = state.doc.line(lineNum);
            const lineText = line.text;
            const newLineText = lineText.startsWith('> ') ? lineText.replace(/^> /, '') : `> ${lineText}`;
            changesQuote.push({
              from: line.from,
              to: line.to,
              insert: newLineText
            });
          }
          
          view.dispatch({
            changes: changesQuote,
            selection: { anchor: from, head: to },
            annotations: formattingAnnotation.of(true)
          });
          return;
          
        case 'link':
          if (selectedText) {
            newText = `[${selectedText}](url)`;
            newSelection = { anchor: from + selectedText.length + 3, head: from + selectedText.length + 6 };
          } else {
            newText = '[link text](url)';
            newSelection = { anchor: from + 1, head: from + 10 };
          }
          break;
          
        case 'image':
          if (selectedText) {
            newText = `![${selectedText}](url)`;
            newSelection = { anchor: from + selectedText.length + 4, head: from + selectedText.length + 7 };
          } else {
            newText = '![alt text](url)';
            newSelection = { anchor: from + 2, head: from + 10 };
          }
          break;
          
        case 'hr':
          newText = '\n---\n';
          newSelection = { anchor: from + newText.length, head: from + newText.length };
          break;
          
        case 'insert-table':
          // Quick 3x3 table
          newText = '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n| Cell 7   | Cell 8   | Cell 9   |\n';
          newSelection = { anchor: from + newText.length, head: from + newText.length };
          break;
          
        case 'insert-table-size':
          // Custom size table - args contain rows and cols
          const rows = args[0] || 3;
          const cols = args[1] || 3;
          
          // Create header row
          let tableText = '\n|';
          for (let c = 1; c <= cols; c++) {
            tableText += ` Header ${c} |`;
          }
          tableText += '\n|';
          
          // Create separator row
          for (let c = 1; c <= cols; c++) {
            tableText += '----------|';
          }
          tableText += '\n';
          
          // Create data rows
          for (let r = 1; r <= rows; r++) {
            tableText += '|';
            for (let c = 1; c <= cols; c++) {
              tableText += ` Cell ${r}-${c} |`;
            }
            tableText += '\n';
          }
          
          newText = tableText;
          newSelection = { anchor: from + newText.length, head: from + newText.length };
          break;
          
        case 'table-add-row-after':
        case 'table-add-row-before':
        case 'table-delete-row':
        case 'table-add-column-after':
        case 'table-add-column-before':
        case 'table-delete-column':
        case 'table-align-left':
        case 'table-align-center':
        case 'table-align-right':
          // Table modification functions
          handleTableModification(view, action, from, to);
          return;
          
        default:
          return;
      }
      
      // Apply the change
      view.dispatch({
        changes: { from, to, insert: newText },
        selection: newSelection,
        annotations: formattingAnnotation.of(true)
      });
    }
  }), [onChange]);

  useEffect(() => {
    if (!editorRef.current || viewRef.current) return; // Don't recreate if already exists

    // Basic setup extensions
    const basicSetupExtensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      searchHighlight(),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        indentWithTab
      ])
    ];

    // Create the editor state with initial content
    const startState = EditorState.create({
      doc: initialContent,
      extensions: [
        ...basicSetupExtensions,
        markdown(),
        theme === 'dark' ? oneDark : githubLight,
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px'
          },
          '.cm-content': {
            padding: '12px',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace'
          },
          '.cm-focused .cm-cursor': {
            borderLeftColor: theme === 'dark' ? '#fff' : '#000'
          },
          '.cm-focused .cm-selectionBackground, ::selection': {
            backgroundColor: theme === 'dark' ? '#264f78' : '#b3d4fc'
          },
          '&.cm-focused': {
            outline: 'none'
          }
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString();
            onChange && onChange(newContent);
          }
        }),
        // Add scroll listener
        EditorView.domEventHandlers({
          scroll: (_, view) => {
            if (!isScrollingRef.current && onScroll) {
              const scrollDOM = view.scrollDOM;
              const scrollPercentage = scrollDOM.scrollTop / (scrollDOM.scrollHeight - scrollDOM.clientHeight);
              onScroll(scrollPercentage, 'editor');
            }
            return false;
          }
        })
      ]
    });

    // Create the editor view
    const view = new EditorView({
      state: startState,
      parent: editorRef.current
    });

    viewRef.current = view;
    editorStateRef.current = startState;

    // Focus the editor
    view.focus();

    // Cleanup
    return () => {
      view.destroy();
    };
  }, []); // Only create once

  // Theme changes are handled by recreating the editor for now
  // This is simpler than trying to reconfigure extensions

  // Handle external scroll requests (from preview)
  useEffect(() => {
    if (scrollToPercentage !== null && scrollToPercentage !== undefined && viewRef.current) {
      isScrollingRef.current = true;
      const scrollDOM = viewRef.current.scrollDOM;
      const scrollTop = scrollToPercentage * (scrollDOM.scrollHeight - scrollDOM.clientHeight);
      scrollDOM.scrollTop = scrollTop;
      
      // Reset flag after a short delay
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
    }
  }, [scrollToPercentage]);

  return (
    <div className="codemirror-editor">
      <div ref={editorRef} className="editor-container" />
    </div>
  );
});

CodeMirrorEditor.displayName = 'CodeMirrorEditor';

export default CodeMirrorEditor;