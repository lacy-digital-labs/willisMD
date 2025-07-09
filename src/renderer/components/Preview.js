import React, { useMemo, useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './Preview.css';

const Preview = ({ content }) => {
  const previewRef = useRef(null);
  
  const htmlContent = useMemo(() => {
    // Configure marked options
    marked.setOptions({
      breaks: true,
      gfm: true,
      tables: true,
      pedantic: false,
      smartLists: true,
      smartypants: true
    });

    // Parse markdown and sanitize HTML
    const rawHtml = marked(content);
    return DOMPurify.sanitize(rawHtml);
  }, [content]);

  useEffect(() => {
    const handleLinkClick = (e) => {
      // Check if the clicked element is a link
      const link = e.target.closest('a');
      if (link && link.href) {
        // Prevent default navigation for non-wiki links
        if (!link.classList.contains('wiki-link')) {
          e.preventDefault();
          
          // Check if it's an external link
          const url = link.href;
          if (url.startsWith('http://') || url.startsWith('https://')) {
            // Open in external browser
            window.electronAPI.openExternal(url);
          }
        }
      }
    };

    const previewElement = previewRef.current;
    if (previewElement) {
      previewElement.addEventListener('click', handleLinkClick);
      
      return () => {
        previewElement.removeEventListener('click', handleLinkClick);
      };
    }
  }, [htmlContent]);

  return (
    <div className="preview" ref={previewRef}>
      <div 
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};

export default Preview;