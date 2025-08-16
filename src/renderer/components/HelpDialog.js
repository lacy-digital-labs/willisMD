import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import './HelpDialog.css';

function HelpDialog({ isOpen, onClose }) {
  const [helpContent, setHelpContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  console.log('HelpDialog: Rendering with isOpen:', isOpen);

  useEffect(() => {
    if (isOpen) {
      console.log('HelpDialog: Dialog is open, loading content');
      loadHelpContent();
    }
  }, [isOpen]);

  const loadHelpContent = async () => {
    console.log('HelpDialog: Loading help content');
    setIsLoading(true);
    try {
      const result = await window.electronAPI.getHelpContent();
      console.log('HelpDialog: Received help content result:', result);
      
      if (result.success) {
        // Configure marked for safe HTML
        marked.setOptions({
          breaks: true,
          gfm: true,
          headerIds: false,
          sanitize: false // We trust our own help content
        });
        
        const htmlContent = marked(result.content);
        setHelpContent(htmlContent);
        console.log('HelpDialog: Help content converted to HTML');
      } else {
        console.error('HelpDialog: Failed to load help content:', result.error);
        // Still show the fallback content
        const htmlContent = marked(result.content);
        setHelpContent(htmlContent);
      }
    } catch (error) {
      console.error('HelpDialog: Error loading help content:', error);
      setHelpContent('<h1>Help Not Available</h1><p>Sorry, the help documentation could not be loaded.</p>');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    console.log('HelpDialog: Not rendering (isOpen is false)');
    return null;
  }

  console.log('HelpDialog: Rendering dialog');

  return (
    <div className="help-dialog-backdrop" onClick={handleBackdropClick}>
      <div className="help-dialog">
        <div className="help-dialog-header">
          <h2>willisMD Help Guide</h2>
          <button className="help-dialog-close" onClick={onClose} aria-label="Close Help">
            ×
          </button>
        </div>
        <div className="help-dialog-content">
          {isLoading ? (
            <div className="help-dialog-loading">
              <p>Loading help content...</p>
            </div>
          ) : (
            <div 
              className="help-content" 
              dangerouslySetInnerHTML={{ __html: helpContent }}
            />
          )}
        </div>
        <div className="help-dialog-footer">
          <button onClick={onClose} className="help-dialog-button">Close</button>
        </div>
      </div>
    </div>
  );
}

export default HelpDialog;