import React, { useState, useEffect, useRef } from 'react';
import './FindReplace.css';

function FindReplace({ isOpen, onClose, textareaRef, onContentChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [showReplace, setShowReplace] = useState(false);
  const [highlightPosition, setHighlightPosition] = useState(null);
  
  const searchInputRef = useRef(null);
  const replaceInputRef = useRef(null);

  // Focus search input when opened and maintain focus
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      // Select any existing text in the search field
      searchInputRef.current.select();
    } else if (!isOpen) {
      // Clear highlights when dialog closes
      clearHighlights();
    }
  }, [isOpen]);

  // Add click handler to prevent losing focus when clicking in the dialog
  const handleDialogClick = (e) => {
    e.stopPropagation();
    // If clicking on the dialog but not on an input, refocus the search input
    if (e.target.closest('.find-replace-container') && !e.target.matches('input, button')) {
      searchInputRef.current?.focus();
    }
  };

  // Search for matches when search term changes
  useEffect(() => {
    if (searchTerm && textareaRef?.current) {
      findMatches();
    } else {
      setCurrentMatch(0);
      setTotalMatches(0);
      clearHighlights();
    }
  }, [searchTerm, caseSensitive, useRegex]);

  const findMatches = () => {
    if (!textareaRef?.current || !searchTerm) return;

    const content = textareaRef.current.value;
    let regex;
    
    try {
      const flags = caseSensitive ? 'g' : 'gi';
      if (useRegex) {
        regex = new RegExp(searchTerm, flags);
      } else {
        // Escape special regex characters for literal search
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escapedTerm, flags);
      }
      
      const matches = [...content.matchAll(regex)];
      setTotalMatches(matches.length);
      setCurrentMatch(matches.length > 0 ? 1 : 0);
      
      // Highlight first match
      if (matches.length > 0) {
        highlightMatch(matches[0].index, matches[0][0].length);
      }
    } catch (error) {
      // Invalid regex
      setTotalMatches(0);
      setCurrentMatch(0);
    }
  };

  const highlightMatch = (start, length) => {
    if (!textareaRef?.current) return;
    
    const textarea = textareaRef.current;
    const currentFocus = document.activeElement;
    const wasSearchFocused = currentFocus === searchInputRef.current || currentFocus === replaceInputRef.current;
    
    // Temporarily prevent focus events on textarea
    const originalTabIndex = textarea.tabIndex;
    if (wasSearchFocused) {
      textarea.tabIndex = -1;
    }
    
    // Set the selection (this may try to focus)
    textarea.setSelectionRange(start, start + length);
    
    // If not focused on search, focus textarea to show selection
    if (!wasSearchFocused) {
      textarea.focus();
    }
    
    // Scroll to the selection
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
    const lines = textarea.value.substring(0, start).split('\n').length;
    const scrollTop = Math.max(0, (lines - 5) * lineHeight);
    textarea.scrollTop = scrollTop;
    
    // Restore tabIndex and focus if needed
    if (wasSearchFocused) {
      textarea.tabIndex = originalTabIndex;
      // Keep focus in search input
      setTimeout(() => {
        if (currentFocus === searchInputRef.current) {
          searchInputRef.current?.focus();
        } else if (currentFocus === replaceInputRef.current) {
          replaceInputRef.current?.focus();
        }
      }, 0);
    }
  };

  const clearHighlights = () => {
    if (!textareaRef?.current) return;
    
    // Clear selection
    const selection = textareaRef.current.selectionStart;
    textareaRef.current.setSelectionRange(selection, selection);
  };

  const findNext = () => {
    if (!textareaRef?.current || !searchTerm || totalMatches === 0) return;

    const content = textareaRef.current.value;
    const currentPos = textareaRef.current.selectionStart;
    
    try {
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = useRegex 
        ? new RegExp(searchTerm, flags)
        : new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      
      const matches = [...content.matchAll(regex)];
      
      if (matches.length === 0) return;
      
      // Find next match after current position
      let nextMatchIndex = -1;
      for (let i = 0; i < matches.length; i++) {
        if (matches[i].index > currentPos) {
          nextMatchIndex = i;
          break;
        }
      }
      
      // If no match found after current position, wrap to first match
      if (nextMatchIndex === -1) {
        nextMatchIndex = 0;
      }
      
      const nextMatch = matches[nextMatchIndex];
      setCurrentMatch(nextMatchIndex + 1);
      
      highlightMatch(nextMatch.index, nextMatch[0].length);
    } catch (error) {
      console.error('Find next error:', error);
    }
  };

  const findPrevious = () => {
    if (!textareaRef?.current || !searchTerm || totalMatches === 0) return;

    const content = textareaRef.current.value;
    const currentPos = textareaRef.current.selectionStart;
    
    try {
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = useRegex 
        ? new RegExp(searchTerm, flags)
        : new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      
      const matches = [...content.matchAll(regex)];
      
      if (matches.length === 0) return;
      
      // Find previous match before current position
      let prevMatchIndex = -1;
      for (let i = matches.length - 1; i >= 0; i--) {
        if (matches[i].index < currentPos) {
          prevMatchIndex = i;
          break;
        }
      }
      
      // If no match found before current position, wrap to last match
      if (prevMatchIndex === -1) {
        prevMatchIndex = matches.length - 1;
      }
      
      const prevMatch = matches[prevMatchIndex];
      setCurrentMatch(prevMatchIndex + 1);
      
      highlightMatch(prevMatch.index, prevMatch[0].length);
    } catch (error) {
      console.error('Find previous error:', error);
    }
  };

  const replaceNext = () => {
    if (!textareaRef?.current || !searchTerm) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    // Check if current selection matches search term
    const flags = caseSensitive ? '' : 'i';
    const regex = useRegex 
      ? new RegExp(searchTerm, flags)
      : new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    
    if (regex.test(selectedText)) {
      // Replace current selection
      const beforeSelection = textarea.value.substring(0, start);
      const afterSelection = textarea.value.substring(end);
      const newContent = beforeSelection + replaceTerm + afterSelection;
      
      // Update through React's onChange handler
      if (onContentChange) {
        onContentChange(newContent);
      }
      
      // Update textarea value and selection
      setTimeout(() => {
        textarea.value = newContent;
        textarea.setSelectionRange(start, start + replaceTerm.length);
        
        // Find next occurrence
        setTimeout(() => findNext(), 10);
      }, 0);
    } else {
      // Find next occurrence first
      findNext();
    }
  };

  const replaceAll = () => {
    if (!textareaRef?.current || !searchTerm) return;

    const textarea = textareaRef.current;
    const content = textarea.value;
    
    try {
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = useRegex 
        ? new RegExp(searchTerm, flags)
        : new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      
      const newContent = content.replace(regex, replaceTerm);
      
      if (newContent !== content) {
        // Update through React's onChange handler
        if (onContentChange) {
          onContentChange(newContent);
        }
        
        // Update textarea value
        setTimeout(() => {
          textarea.value = newContent;
        }, 0);
        
        // Clear search to show results
        setSearchTerm('');
        setCurrentMatch(0);
        setTotalMatches(0);
      }
    } catch (error) {
      console.error('Replace all error:', error);
    }
  };

  const handleKeyDown = (e) => {
    // Prevent event from bubbling up to parent components
    e.stopPropagation();
    
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        findPrevious();
      } else {
        findNext();
      }
      e.preventDefault();
    } else if (e.key === 'Tab') {
      if (showReplace && e.target === searchInputRef.current) {
        e.preventDefault();
        replaceInputRef.current?.focus();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="find-replace-container"
      onKeyDown={(e) => {
        // Prevent all keyboard events from bubbling up when dialog is focused
        e.stopPropagation();
        handleKeyDown(e);
      }}
      onClick={handleDialogClick}
    >
      <div className="find-replace-bar">
        <div className="find-replace-content">
          {/* Search Section */}
          <div className="search-section">
            <div className="search-input-group">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Find"
                className="search-input"
              />
              <div className="search-info">
                {totalMatches > 0 ? `${currentMatch}/${totalMatches}` : totalMatches === 0 && searchTerm ? 'No results' : ''}
              </div>
            </div>
            
            <div className="search-controls">
              <button
                onClick={findPrevious}
                disabled={totalMatches === 0}
                className="control-button"
                title="Find Previous (Shift+Enter)"
              >
                ↑
              </button>
              <button
                onClick={findNext}
                disabled={totalMatches === 0}
                className="control-button"
                title="Find Next (Enter)"
              >
                ↓
              </button>
              <button
                onClick={() => setShowReplace(!showReplace)}
                className={`control-button ${showReplace ? 'active' : ''}`}
                title="Toggle Replace"
              >
                ↔
              </button>
            </div>
          </div>

          {/* Replace Section */}
          {showReplace && (
            <div className="replace-section">
              <div className="replace-input-group">
                <input
                  ref={replaceInputRef}
                  type="text"
                  value={replaceTerm}
                  onChange={(e) => setReplaceTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Replace"
                  className="replace-input"
                />
              </div>
              
              <div className="replace-controls">
                <button
                  onClick={replaceNext}
                  disabled={totalMatches === 0}
                  className="control-button"
                  title="Replace Next"
                >
                  Replace
                </button>
                <button
                  onClick={replaceAll}
                  disabled={totalMatches === 0}
                  className="control-button"
                  title="Replace All"
                >
                  All
                </button>
              </div>
            </div>
          )}

          {/* Options */}
          <div className="options-section">
            <label className="option-label">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
              />
              <span>Aa</span>
            </label>
            <label className="option-label">
              <input
                type="checkbox"
                checked={useRegex}
                onChange={(e) => setUseRegex(e.target.checked)}
              />
              <span>.*</span>
            </label>
          </div>
        </div>

        <button onClick={onClose} className="close-button" title="Close (Esc)">
          ×
        </button>
      </div>
    </div>
  );
}

export default FindReplace;