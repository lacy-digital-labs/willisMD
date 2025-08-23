import React, { useState, useEffect, useCallback } from 'react';
import { lintResultsManager } from '../markdownLinter';

const LintPanel = ({ isVisible, onToggle, onNavigateToLine, lintPreferences = {} }) => {
  const [lintResults, setLintResults] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Filter results based on preferences
  const getFilteredResults = useCallback((results) => {
    if (!lintPreferences.markdownLinting) return results;
    
    const { enabled, showErrors, showWarnings, showInfo } = lintPreferences.markdownLinting;
    
    if (!enabled) return [];
    
    return results.filter(result => {
      if (result.severity === 'error' && !showErrors) return false;
      if (result.severity === 'warning' && !showWarnings) return false;
      if (result.severity === 'info' && !showInfo) return false;
      return true;
    });
  }, [lintPreferences]);

  useEffect(() => {
    // Listen for lint results updates
    const handleLintUpdate = (results) => {
      setLintResults(getFilteredResults(results));
    };

    lintResultsManager.addListener(handleLintUpdate);
    
    // Get initial results
    setLintResults(getFilteredResults(lintResultsManager.getResults()));

    return () => {
      lintResultsManager.removeListener(handleLintUpdate);
    };
  }, [getFilteredResults]);

  // Don't render if not visible or if linting is disabled
  if (!isVisible || (lintPreferences.markdownLinting && !lintPreferences.markdownLinting.enabled)) return null;

  // Count filtered results
  const errorCount = lintResults.filter(r => r.severity === 'error').length;
  const warningCount = lintResults.filter(r => r.severity === 'warning').length;
  const infoCount = lintResults.filter(r => r.severity === 'info').length;
  const totalCount = lintResults.length;

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error': return '●';
      case 'warning': return '▲';
      case 'info': return 'ⓘ';
      default: return '○';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info': return '#4078c0';
      default: return '#6a737d';
    }
  };

  const handleItemClick = (result) => {
    if (onNavigateToLine && result.from !== undefined) {
      onNavigateToLine(result.from);
    }
  };

  const handleClearAll = () => {
    lintResultsManager.clearResults();
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-medium)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: isCollapsed ? '32px' : '200px',
      maxHeight: isCollapsed ? '32px' : '300px',
      fontSize: '13px',
      color: 'var(--text-primary)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        backgroundColor: 'var(--bg-tertiary)',
        borderBottom: isCollapsed ? 'none' : '1px solid var(--border-light)',
        cursor: 'pointer',
        userSelect: 'none'
      }} onClick={() => setIsCollapsed(!isCollapsed)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {isCollapsed ? '▶' : '▼'}
          </span>
          <span style={{ fontWeight: '600' }}>
            Markdown Lint Results
          </span>
          {totalCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {errorCount > 0 && (
                <span style={{ 
                  color: '#dc3545',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}>
                  ● {errorCount}
                </span>
              )}
              {warningCount > 0 && (
                <span style={{ 
                  color: '#ffc107',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}>
                  ▲ {warningCount}
                </span>
              )}
              {infoCount > 0 && (
                <span style={{ 
                  color: '#4078c0',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}>
                  ⓘ {infoCount}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {totalCount > 0 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '11px'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-accent)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                title="Clear all lint results"
              >
                Clear
              </button>
            </>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '12px'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-accent)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            title="Hide lint panel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Results List */}
      {!isCollapsed && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: totalCount === 0 ? '20px' : '0'
        }}>
          {totalCount === 0 ? (
            <div style={{
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontStyle: 'italic'
            }}>
              <div style={{ marginBottom: '8px', fontSize: '24px' }}>✨</div>
              <div>No lint issues found</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>
                Your markdown looks great!
              </div>
            </div>
          ) : (
            <div>
              {lintResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleItemClick(result)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border-light)',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-accent)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {/* Severity Icon */}
                  <span style={{
                    color: getSeverityColor(result.severity),
                    fontSize: '14px',
                    flexShrink: 0,
                    marginTop: '1px'
                  }}>
                    {getSeverityIcon(result.severity)}
                  </span>
                  
                  {/* Message Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: 'var(--text-primary)',
                      lineHeight: '1.4',
                      marginBottom: '2px'
                    }}>
                      {result.message}
                    </div>
                    
                    {result.rule && (
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary)'
                      }}>
                        Rule: {result.rule}
                      </div>
                    )}
                  </div>
                  
                  {/* Line Number */}
                  {result.from !== undefined && (
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      flexShrink: 0,
                      backgroundColor: 'var(--bg-primary)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: '1px solid var(--border-light)'
                    }}>
                      Line {result.line || Math.floor(result.from / 100) + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LintPanel;