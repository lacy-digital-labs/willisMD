import React from 'react';
import './Toolbar.css';

const Toolbar = () => {
  const insertMarkdown = (before, after = '') => {
    // This will be implemented later with proper editor integration
    console.log('Insert markdown:', before, after);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button onClick={() => insertMarkdown('**', '**')} title="Bold">
          <strong>B</strong>
        </button>
        <button onClick={() => insertMarkdown('*', '*')} title="Italic">
          <em>I</em>
        </button>
        <button onClick={() => insertMarkdown('~~', '~~')} title="Strikethrough">
          <s>S</s>
        </button>
      </div>
      
      <div className="toolbar-group">
        <button onClick={() => insertMarkdown('# ')} title="Heading 1">
          H1
        </button>
        <button onClick={() => insertMarkdown('## ')} title="Heading 2">
          H2
        </button>
        <button onClick={() => insertMarkdown('### ')} title="Heading 3">
          H3
        </button>
      </div>
      
      <div className="toolbar-group">
        <button onClick={() => insertMarkdown('- ')} title="Unordered List">
          •
        </button>
        <button onClick={() => insertMarkdown('1. ')} title="Ordered List">
          1.
        </button>
        <button onClick={() => insertMarkdown('- [ ] ')} title="Task List">
          ☐
        </button>
      </div>
      
      <div className="toolbar-group">
        <button onClick={() => insertMarkdown('[', '](url)')} title="Link">
          🔗
        </button>
        <button onClick={() => insertMarkdown('![', '](url)')} title="Image">
          🖼
        </button>
        <button onClick={() => insertMarkdown('`', '`')} title="Inline Code">
          {'<>'}
        </button>
        <button onClick={() => insertMarkdown('```\n', '\n```')} title="Code Block">
          {'{ }'}
        </button>
      </div>
      
      <div className="toolbar-group">
        <button onClick={() => insertMarkdown('> ')} title="Quote">
          "
        </button>
        <button onClick={() => insertMarkdown('---\n')} title="Horizontal Rule">
          —
        </button>
      </div>
    </div>
  );
};

export default Toolbar;