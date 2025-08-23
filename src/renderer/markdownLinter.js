import { linter, Diagnostic, setDiagnostics } from '@codemirror/lint';
import { defaultLintConfig, convertToDiagnostics, mergeConfig } from './markdownLintConfig';

// Import markdownlint using the correct API
let markdownlintLint;
try {
  // Try the new API first
  markdownlintLint = require('markdownlint/sync').lint;
} catch (e) {
  console.warn('Could not load markdownlint, using fallback linter');
}

// Debounce function to limit linting frequency
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Store current preferences globally so the linter can access them
let currentLintPreferences = {};

export function updateLintPreferences(prefs) {
  currentLintPreferences = prefs;
}

// Create the markdown linter for CodeMirror
export function createMarkdownLinter(initialPreferences = {}) {
  const config = mergeConfig({});
  
  // Set initial preferences
  currentLintPreferences = initialPreferences;
  
  // The linting function
  const markdownLintSource = async (view) => {
    // Use the current preferences, not the initial ones
    const lintPreferences = currentLintPreferences;
    
    // Check if linting is disabled entirely
    if (lintPreferences && lintPreferences.markdownLinting && !lintPreferences.markdownLinting.enabled) {
      // Clear any existing results and return empty
      lintResultsManager.updateResults([]);
      return [];
    }
    
    const doc = view.state.doc;
    const content = doc.toString();
    
    // Skip linting for empty documents
    if (!content.trim()) {
      return [];
    }
    
    try {
      // Run markdownlint
      const options = {
        strings: {
          content: content
        },
        config: config
      };
      
      // Use the imported lint function
      if (!markdownlintLint) {
        console.warn('Markdownlint not available, skipping linting');
        return [];
      }
      
      const results = markdownlintLint(options);
      
      // Convert to CodeMirror diagnostics
      const diagnostics = [];
      
      if (results.content && results.content.length > 0) {
        for (const error of results.content) {
          const lineNumber = error.lineNumber - 1; // Convert to 0-based
          const line = doc.line(Math.min(lineNumber + 1, doc.lines));
          
          // Determine severity
          let severity = 'warning';
          if (error.ruleNames[0]) {
            const ruleName = error.ruleNames[0];
            // Critical rules are errors
            if (['MD045', 'MD042', 'MD037', 'MD038', 'MD039'].includes(ruleName)) {
              severity = 'error';
            }
            // Style rules are info
            else if (['MD007', 'MD012', 'MD013', 'MD029', 'MD030'].includes(ruleName)) {
              severity = 'info';
            }
          }
          
          // Filter based on severity preferences (we already checked if linting is disabled above)
          if (lintPreferences && lintPreferences.markdownLinting) {
            const { showErrors, showWarnings, showInfo } = lintPreferences.markdownLinting;
            // Skip based on severity preferences
            if (severity === 'error' && !showErrors) continue;
            if (severity === 'warning' && !showWarnings) continue;
            if (severity === 'info' && !showInfo) continue;
          }
          
          const diagnostic = {
            from: line.from,
            to: line.to,
            severity: severity,
            message: error.ruleDescription,
            source: `markdownlint (${error.ruleNames.join(', ')})`,
            rule: error.ruleNames[0],
            line: lineNumber + 1,
            renderMessage: () => {
              const dom = document.createElement('div');
              dom.className = 'cm-lint-message';
              
              const title = document.createElement('div');
              title.className = 'cm-lint-message-title';
              title.textContent = error.ruleDescription;
              dom.appendChild(title);
              
              const rule = document.createElement('div');
              rule.className = 'cm-lint-message-rule';
              rule.textContent = `Rule: ${error.ruleNames.join(', ')}`;
              dom.appendChild(rule);
              
              if (error.errorDetail) {
                const detail = document.createElement('div');
                detail.className = 'cm-lint-message-detail';
                detail.textContent = error.errorDetail;
                dom.appendChild(detail);
              }
              
              if (error.fixInfo) {
                const fix = document.createElement('div');
                fix.className = 'cm-lint-message-fix';
                fix.textContent = '💡 Quick fix available';
                dom.appendChild(fix);
              }
              
              return dom;
            }
          };
          
          // Add fix info if available
          if (error.fixInfo) {
            diagnostic.actions = [{
              name: '💡 Quick Fix',
              apply: (view, from, to) => {
                // Apply the fix based on fixInfo
                const lineStart = line.from;
                let fixFrom = lineStart;
                let fixTo = lineStart;
                let replacement = '';
                
                if (error.fixInfo.deleteCount !== undefined) {
                  // Delete characters
                  fixFrom = lineStart + (error.fixInfo.editColumn || 1) - 1;
                  fixTo = fixFrom + error.fixInfo.deleteCount;
                }
                
                if (error.fixInfo.insertText !== undefined) {
                  // Insert text
                  fixFrom = lineStart + (error.fixInfo.editColumn || 1) - 1;
                  fixTo = fixFrom;
                  replacement = error.fixInfo.insertText;
                }
                
                view.dispatch({
                  changes: { from: fixFrom, to: fixTo, insert: replacement }
                });
              }
            }];
          }
          
          // Add additional rule-specific quick fixes
          const ruleName = error.ruleNames[0];
          if (!diagnostic.actions) diagnostic.actions = [];
          
          switch (ruleName) {
            case 'MD045': // Images without alt text
              diagnostic.actions.push({
                name: '🖼️ Add Alt Text',
                apply: (view) => quickFixes.addMissingAltText(view)
              });
              break;
              
            case 'MD009': // Trailing spaces
              diagnostic.actions.push({
                name: '✂️ Remove Trailing Spaces',
                apply: (view) => quickFixes.fixTrailingSpaces(view)
              });
              break;
              
            case 'MD004': // Inconsistent list markers
              diagnostic.actions.push({
                name: '📋 Fix List Markers',
                apply: (view) => quickFixes.fixListMarkers(view, '-')
              });
              break;
              
            case 'MD012': // Multiple blank lines
              diagnostic.actions.push({
                name: '📄 Fix Blank Lines',
                apply: (view) => quickFixes.fixMultipleBlankLines(view, 1)
              });
              break;
              
            case 'MD001': // Header increment
              diagnostic.actions.push({
                name: '📰 Fix Header Levels',
                apply: (view) => quickFixes.fixHeaderIncrement(view)
              });
              break;
          }
          
          diagnostics.push(diagnostic);
        }
      }
      
      // Update the results manager
      lintResultsManager.updateResults(diagnostics);
      
      return diagnostics;
    } catch (error) {
      console.error('Markdown linting error:', error);
      return [];
    }
  };
  
  // Create debounced version for real-time linting
  const debouncedLintSource = debounce(markdownLintSource, 500);
  
  return linter(markdownLintSource, {
    delay: 500,
    needsRefresh: (update) => {
      // Re-lint on document changes
      return update.docChanged;
    }
  });
}

// Create quick fix functions for common issues
export const quickFixes = {
  // Fix trailing spaces
  fixTrailingSpaces: (view) => {
    const changes = [];
    const doc = view.state.doc;
    
    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const text = doc.sliceString(line.from, line.to);
      const trimmed = text.replace(/[ \t]+$/, '');
      
      if (text !== trimmed) {
        changes.push({
          from: line.from,
          to: line.to,
          insert: trimmed
        });
      }
    }
    
    if (changes.length > 0) {
      view.dispatch({ changes });
      return true;
    }
    return false;
  },
  
  // Fix inconsistent list markers
  fixListMarkers: (view, style = '-') => {
    const changes = [];
    const doc = view.state.doc;
    const listRegex = /^(\s*)([-*+])\s+/;
    
    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const text = doc.sliceString(line.from, line.to);
      const match = text.match(listRegex);
      
      if (match && match[2] !== style) {
        const newText = text.replace(listRegex, `$1${style} `);
        changes.push({
          from: line.from,
          to: line.to,
          insert: newText
        });
      }
    }
    
    if (changes.length > 0) {
      view.dispatch({ changes });
      return true;
    }
    return false;
  },
  
  // Add missing alt text placeholders
  addMissingAltText: (view) => {
    const changes = [];
    const doc = view.state.doc;
    const imageRegex = /!\[\]\(/g;
    
    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const text = doc.sliceString(line.from, line.to);
      
      if (imageRegex.test(text)) {
        const newText = text.replace(imageRegex, '![Image description](');
        changes.push({
          from: line.from,
          to: line.to,
          insert: newText
        });
      }
    }
    
    if (changes.length > 0) {
      view.dispatch({ changes });
      return true;
    }
    return false;
  },
  
  // Fix multiple consecutive blank lines
  fixMultipleBlankLines: (view, maxBlankLines = 1) => {
    const doc = view.state.doc;
    const text = doc.toString();
    const regex = new RegExp(`\n{${maxBlankLines + 2},}`, 'g');
    const fixed = text.replace(regex, '\n'.repeat(maxBlankLines + 1));
    
    if (text !== fixed) {
      view.dispatch({
        changes: { from: 0, to: doc.length, insert: fixed }
      });
      return true;
    }
    return false;
  },
  
  // Fix header increment issues
  fixHeaderIncrement: (view) => {
    const changes = [];
    const doc = view.state.doc;
    let lastLevel = 0;
    
    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const text = doc.sliceString(line.from, line.to);
      const match = text.match(/^(#+)\s+/);
      
      if (match) {
        const currentLevel = match[1].length;
        
        if (lastLevel > 0 && currentLevel > lastLevel + 1) {
          // Fix the increment
          const newLevel = lastLevel + 1;
          const newText = text.replace(/^#+/, '#'.repeat(newLevel));
          changes.push({
            from: line.from,
            to: line.to,
            insert: newText
          });
          lastLevel = newLevel;
        } else {
          lastLevel = currentLevel;
        }
      }
    }
    
    if (changes.length > 0) {
      view.dispatch({ changes });
      return true;
    }
    return false;
  }
};

// Export utilities for managing lint results
export class LintResultsManager {
  constructor() {
    this.results = [];
    this.listeners = new Set();
  }
  
  updateResults(results) {
    this.results = results;
    this.notifyListeners();
  }
  
  clearResults() {
    this.results = [];
    this.notifyListeners();
  }
  
  getResults() {
    return this.results;
  }
  
  getErrorCount() {
    return this.results.filter(r => r.severity === 'error').length;
  }
  
  getWarningCount() {
    return this.results.filter(r => r.severity === 'warning').length;
  }
  
  getInfoCount() {
    return this.results.filter(r => r.severity === 'info').length;
  }
  
  addListener(callback) {
    this.listeners.add(callback);
  }
  
  removeListener(callback) {
    this.listeners.delete(callback);
  }
  
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.results));
  }
}

// Create a singleton instance
export const lintResultsManager = new LintResultsManager();