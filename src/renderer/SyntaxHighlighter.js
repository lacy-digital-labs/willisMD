// Markdown syntax patterns
const patterns = [
  // Headers
  { regex: /^(#{1,6})\s+(.*)$/gm, className: 'markdown-h1' },
  // Bold
  { regex: /\*\*([^*]+)\*\*/g, className: 'markdown-bold' },
  { regex: /__([^_]+)__/g, className: 'markdown-bold' },
  // Italic
  { regex: /\*([^*]+)\*/g, className: 'markdown-italic' },
  { regex: /_([^_]+)_/g, className: 'markdown-italic' },
  // Code blocks
  { regex: /```[\s\S]*?```/g, className: 'markdown-code-block' },
  // Inline code
  { regex: /`([^`]+)`/g, className: 'markdown-code' },
  // Links
  { regex: /\[([^\]]+)\]\(([^)]+)\)/g, className: 'markdown-link' },
  // Blockquotes
  { regex: /^>\s+(.*)$/gm, className: 'markdown-blockquote' },
  // Lists
  { regex: /^[\s]*[-*+]\s+(.*)$/gm, className: 'markdown-list' },
  { regex: /^[\s]*\d+\.\s+(.*)$/gm, className: 'markdown-list' },
  // Horizontal rules
  { regex: /^---+$|^___+$|^\*\*\*+$/gm, className: 'markdown-hr' }
];

export function highlightMarkdown(text) {
  if (!text) return '';
  
  // Create a map to track all matches and their positions
  const matches = [];
  
  patterns.forEach(({ regex, className }) => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        className,
        text: match[0]
      });
    }
  });
  
  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);
  
  // Build highlighted HTML
  let result = '';
  let lastIndex = 0;
  
  matches.forEach(match => {
    // Add text before match
    if (match.start > lastIndex) {
      result += escapeHtml(text.substring(lastIndex, match.start));
    }
    
    // Add highlighted match
    result += `<span class="${match.className}">${escapeHtml(match.text)}</span>`;
    
    lastIndex = match.end;
  });
  
  // Add remaining text
  if (lastIndex < text.length) {
    result += escapeHtml(text.substring(lastIndex));
  }
  
  return result;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML
    .replace(/\n/g, '\n') // Preserve newlines
    .replace(/ {2,}/g, (match) => match); // Preserve multiple spaces
}