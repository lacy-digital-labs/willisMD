import React, { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine, highlightSelectionMatches } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultHighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { history, defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches as searchHighlight } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { githubLight } from '@uiw/codemirror-theme-github';
import './CodeMirrorEditor.css';

const CodeMirrorEditor = ({ content, onChange, theme = 'light', onScroll, scrollToPercentage }) => {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const isUpdatingRef = useRef(false);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (!editorRef.current) return;

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

    // Create the editor state
    const startState = EditorState.create({
      doc: content || '',
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
          if (update.docChanged && !isUpdatingRef.current) {
            const newContent = update.state.doc.toString();
            onChange && onChange(newContent);
          }
        }),
        // Add scroll listener
        EditorView.domEventHandlers({
          scroll: (event, view) => {
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

    // Focus the editor
    view.focus();

    // Cleanup
    return () => {
      view.destroy();
    };
  }, [theme]); // Only recreate on theme change

  // Update content when it changes externally
  useEffect(() => {
    if (!viewRef.current) return;
    
    const currentContent = viewRef.current.state.doc.toString();
    if (content !== currentContent) {
      isUpdatingRef.current = true;
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: content || ''
        }
      });
      // Use setTimeout to reset flag after dispatch is processed
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [content]);

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
};

export default CodeMirrorEditor;