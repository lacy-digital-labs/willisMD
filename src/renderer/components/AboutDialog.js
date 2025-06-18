import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import './AboutDialog.css';

function AboutDialog({ isOpen, onClose }) {
  const [aboutContent, setAboutContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  console.log('AboutDialog: Rendering with isOpen:', isOpen);

  useEffect(() => {
    if (isOpen) {
      console.log('AboutDialog: Dialog is open, loading content');
      loadAboutContent();
    }
  }, [isOpen]);

  const loadAboutContent = async () => {
    try {
      setIsLoading(true);
      const result = await window.electronAPI.readAboutContent();
      if (result.success) {
        // Parse markdown to HTML using marked
        const html = marked(result.content);
        setAboutContent(html);
      } else {
        setAboutContent('<p>Failed to load about content.</p>');
      }
    } catch (error) {
      console.error('Error loading about content:', error);
      setAboutContent('<p>Error loading about content.</p>');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="about-dialog-backdrop" onClick={handleBackdropClick}>
      <div className="about-dialog">
        <div className="about-dialog-header">
          <h2>About willisMD</h2>
          <button className="about-close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="about-dialog-content">
          {isLoading ? (
            <div className="about-loading">Loading...</div>
          ) : (
            <div 
              className="about-markdown-content"
              dangerouslySetInnerHTML={{ __html: aboutContent }}
            />
          )}
        </div>
        <div className="about-dialog-footer">
          <button className="about-ok-button" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default AboutDialog;