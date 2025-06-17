import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './Preview.css';

const Preview = ({ content }) => {
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

  return (
    <div className="preview">
      <div 
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};

export default Preview;