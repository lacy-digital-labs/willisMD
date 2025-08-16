// Preview styles for different document formats
export const previewStyles = {
  standard: {
    name: 'Standard',
    css: `
      .preview-content {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: var(--preview-text);
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        margin-top: 24px;
        margin-bottom: 16px;
        font-weight: 600;
        color: var(--text-primary);
      }
      .preview-content h1 { font-size: 2em; border-bottom: 1px solid var(--border-light); padding-bottom: 0.3em; }
      .preview-content h2 { font-size: 1.5em; }
      .preview-content h3 { font-size: 1.25em; }
      .preview-content pre {
        background-color: var(--bg-tertiary);
        color: var(--text-primary);
        padding: 16px;
        overflow: auto;
        border-radius: 6px;
      }
      .preview-content code {
        background-color: var(--bg-tertiary);
        color: var(--syntax-keyword);
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-size: 85%;
      }
      .preview-content blockquote {
        border-left: 4px solid var(--accent-primary);
        padding-left: 16px;
        margin-left: 0;
        color: var(--text-secondary);
        font-style: italic;
      }
      .preview-content table {
        border-collapse: collapse;
        margin: 16px 0;
        width: 100%;
      }
      .preview-content table th, .preview-content table td {
        border: 1px solid var(--border-medium);
        padding: 6px 13px;
        text-align: left;
      }
      .preview-content table th {
        background-color: var(--bg-tertiary);
        font-weight: bold;
      }
      .preview-content table tr:nth-child(2n) {
        background-color: var(--bg-secondary);
      }
      .preview-content img {
        max-width: 100%;
        height: auto;
      }
      .preview-content a {
        color: var(--accent-primary);
        text-decoration: none;
      }
      .preview-content a:hover {
        color: var(--accent-hover);
        text-decoration: underline;
      }
      .preview-content p, .preview-content div, .preview-content span, .preview-content li, .preview-content td {
        color: var(--preview-text);
      }
    `
  },
  
  modern: {
    name: 'Modern',
    css: `
      .preview-content {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.8;
        color: #1a1a1a;
        max-width: 900px;
        margin: 0 auto;
        padding: 40px 20px;
        background: #fafafa;
      }
      .preview-content p, .preview-content div, .preview-content span, .preview-content li, .preview-content td {
        color: #1a1a1a;
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        margin-top: 32px;
        margin-bottom: 20px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .preview-content h1 { 
        font-size: 3em; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 32px;
      }
      .preview-content h2 { font-size: 2.2em; color: #2d3748; }
      .preview-content h3 { font-size: 1.8em; color: #4a5568; }
      .preview-content pre {
        background: #1a202c;
        color: #e2e8f0;
        padding: 24px;
        overflow: auto;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .preview-content code {
        background: #edf2f7;
        color: #d53f8c;
        padding: 0.3em 0.5em;
        border-radius: 6px;
        font-size: 90%;
        font-family: 'Fira Code', 'Consolas', monospace;
      }
      .preview-content blockquote {
        border-left: 6px solid #667eea;
        padding-left: 24px;
        margin: 32px 0;
        color: #4a5568;
        font-style: italic;
        background: #f7fafc;
        padding: 20px 20px 20px 30px;
        border-radius: 0 8px 8px 0;
      }
      .preview-content table {
        border-collapse: collapse;
        margin: 24px 0;
        width: 100%;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        overflow: hidden;
      }
      .preview-content table th {
        background: #667eea;
        color: white;
        font-weight: 600;
        padding: 12px 16px;
        text-align: left;
      }
      .preview-content table td {
        padding: 12px 16px;
        border-bottom: 1px solid #e2e8f0;
      }
      .preview-content table tr:last-child td {
        border-bottom: none;
      }
      .preview-content table tr:nth-child(even) {
        background-color: #f7fafc;
      }
      .preview-content img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .preview-content a {
        color: #667eea;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s;
      }
      .preview-content a:hover {
        color: #764ba2;
        text-decoration: underline;
      }
      .preview-content p {
        margin-bottom: 20px;
      }
      .preview-content ul, .preview-content ol {
        margin-bottom: 20px;
        padding-left: 30px;
      }
      .preview-content li {
        margin-bottom: 8px;
      }
    `
  },
  
  manuscript: {
    name: 'Manuscript',
    css: `
      .preview-content {
        font-family: 'Courier New', Courier, monospace;
        line-height: 2;
        color: #000;
        max-width: 600px;
        margin: 0 auto;
        padding: 1in;
        background: #fff;
      }
      .preview-content p, .preview-content div, .preview-content span, .preview-content li, .preview-content td {
        color: #000;
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        font-family: 'Courier New', Courier, monospace;
        text-transform: uppercase;
        text-align: center;
        margin: 36px 0 24px 0;
        font-weight: normal;
      }
      .preview-content h1 { 
        font-size: 14pt;
        letter-spacing: 2px;
        page-break-before: always;
      }
      .preview-content h2 { font-size: 12pt; }
      .preview-content h3 { font-size: 12pt; font-style: italic; }
      .preview-content p {
        text-indent: 0.5in;
        margin: 0;
        text-align: justify;
      }
      .preview-content p:first-of-type,
      .preview-content h1 + p,
      .preview-content h2 + p,
      .preview-content h3 + p,
      .preview-content blockquote + p {
        text-indent: 0;
      }
      .preview-content pre {
        font-family: 'Courier New', Courier, monospace;
        background: #f8f8f8;
        border: 1px solid #ddd;
        padding: 12px;
        margin: 24px 0;
        font-size: 11pt;
        line-height: 1.4;
      }
      .preview-content code {
        font-family: 'Courier New', Courier, monospace;
        background: #f0f0f0;
        padding: 2px 4px;
        font-size: 11pt;
      }
      .preview-content blockquote {
        margin: 24px 48px;
        font-style: italic;
        border: none;
        padding: 0;
      }
      .preview-content table {
        margin: 24px auto;
        border-collapse: collapse;
        font-size: 11pt;
      }
      .preview-content table th, .preview-content table td {
        border: 1px solid #000;
        padding: 8px 12px;
        text-align: left;
      }
      .preview-content table th {
        font-weight: bold;
        text-transform: uppercase;
      }
      .preview-content img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 24px auto;
      }
      .preview-content a {
        color: #000;
        text-decoration: underline;
      }
      .preview-content ul, .preview-content ol {
        margin: 12px 0;
        padding-left: 0.5in;
      }
      .preview-content li {
        margin-bottom: 6px;
      }
      .preview-content hr {
        border: none;
        text-align: center;
        margin: 36px 0;
      }
      .preview-content hr:after {
        content: "* * *";
        letter-spacing: 0.5em;
      }
    `
  },
  
  business: {
    name: 'Business',
    css: `
      .preview-content {
        font-family: 'Arial', 'Helvetica Neue', sans-serif;
        line-height: 1.5;
        color: #212529;
        max-width: 850px;
        margin: 0 auto;
        padding: 30px;
        background: #fff;
      }
      .preview-content p, .preview-content div, .preview-content span, .preview-content li, .preview-content td {
        color: #212529;
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        font-family: 'Arial', 'Helvetica Neue', sans-serif;
        margin-top: 28px;
        margin-bottom: 14px;
        font-weight: bold;
        color: #003366;
      }
      .preview-content h1 { 
        font-size: 24pt;
        border-bottom: 3px solid #003366;
        padding-bottom: 8px;
        margin-bottom: 24px;
      }
      .preview-content h2 { 
        font-size: 18pt;
        border-bottom: 1px solid #ccc;
        padding-bottom: 6px;
      }
      .preview-content h3 { font-size: 14pt; }
      .preview-content p {
        margin-bottom: 12px;
        text-align: justify;
      }
      .preview-content pre {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        padding: 12px;
        overflow: auto;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 10pt;
      }
      .preview-content code {
        background: #f8f9fa;
        padding: 2px 4px;
        border: 1px solid #dee2e6;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 10pt;
      }
      .preview-content blockquote {
        border-left: 4px solid #003366;
        padding-left: 16px;
        margin: 16px 0;
        color: #495057;
        font-style: italic;
      }
      .preview-content table {
        border-collapse: collapse;
        margin: 20px 0;
        width: 100%;
        font-size: 10pt;
      }
      .preview-content table th {
        background: #003366;
        color: white;
        font-weight: bold;
        padding: 10px 12px;
        text-align: left;
        border: 1px solid #003366;
      }
      .preview-content table td {
        padding: 8px 12px;
        border: 1px solid #dee2e6;
      }
      .preview-content table tr:nth-child(even) {
        background-color: #f8f9fa;
      }
      .preview-content img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 20px auto;
        border: 1px solid #dee2e6;
      }
      .preview-content a {
        color: #003366;
        text-decoration: none;
        font-weight: 500;
      }
      .preview-content a:hover {
        text-decoration: underline;
      }
      .preview-content ul, .preview-content ol {
        margin-bottom: 12px;
        padding-left: 25px;
      }
      .preview-content li {
        margin-bottom: 4px;
      }
      .preview-content strong {
        font-weight: bold;
        color: #003366;
      }
    `
  },
  
  informal: {
    name: 'Informal',
    css: `
      .preview-content {
        font-family: 'Comic Sans MS', 'Chalkboard SE', 'Bradley Hand', cursive;
        line-height: 1.8;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 30px;
        background: #fffef0;
        background-image: 
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 27px,
            #e8e8e8 27px,
            #e8e8e8 28px
          );
      }
      .preview-content p, .preview-content div, .preview-content span, .preview-content li, .preview-content td {
        color: #333;
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        font-family: 'Comic Sans MS', 'Chalkboard SE', cursive;
        margin-top: 28px;
        margin-bottom: 16px;
        font-weight: bold;
        color: #ff6b6b;
      }
      .preview-content h1 { 
        font-size: 2.5em;
        text-align: center;
        color: #ff6b6b;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        border: none;
        background: linear-gradient(to right, #feca57, #ff9ff3, #54a0ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .preview-content h2 { 
        font-size: 2em;
        color: #54a0ff;
        border-bottom: 3px wavy #54a0ff;
      }
      .preview-content h3 { 
        font-size: 1.5em;
        color: #48dbfb;
      }
      .preview-content p {
        margin-bottom: 16px;
        font-size: 16px;
      }
      .preview-content pre {
        background: #fff;
        border: 2px dashed #54a0ff;
        padding: 16px;
        overflow: auto;
        border-radius: 15px;
        font-family: 'Monaco', 'Courier New', monospace;
        box-shadow: 3px 3px 0 #feca57;
      }
      .preview-content code {
        background: #ffeaa7;
        padding: 3px 6px;
        border-radius: 5px;
        font-family: 'Monaco', 'Courier New', monospace;
        color: #2d3436;
      }
      .preview-content blockquote {
        border-left: 5px solid #ff9ff3;
        padding: 12px 20px;
        margin: 20px 0;
        background: #fff0f6;
        border-radius: 0 10px 10px 0;
        font-style: italic;
        position: relative;
      }
      .preview-content blockquote:before {
        content: '"';
        font-size: 3em;
        color: #ff9ff3;
        position: absolute;
        left: 10px;
        top: -10px;
      }
      .preview-content table {
        border-collapse: separate;
        border-spacing: 0;
        margin: 20px 0;
        width: 100%;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 3px 3px 0 #54a0ff;
      }
      .preview-content table th {
        background: #54a0ff;
        color: white;
        font-weight: bold;
        padding: 12px;
        text-align: left;
      }
      .preview-content table td {
        padding: 10px 12px;
        border-bottom: 1px solid #e8e8e8;
        background: white;
      }
      .preview-content table tr:last-child td {
        border-bottom: none;
      }
      .preview-content table tr:nth-child(even) td {
        background-color: #f0f8ff;
      }
      .preview-content img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 20px auto;
        border-radius: 10px;
        box-shadow: 5px 5px 0 #feca57;
        transform: rotate(-1deg);
      }
      .preview-content a {
        color: #ff6b6b;
        text-decoration: none;
        font-weight: bold;
        background: linear-gradient(to bottom, transparent 60%, #feca57 60%);
        transition: background 0.3s;
      }
      .preview-content a:hover {
        background: linear-gradient(to bottom, transparent 30%, #feca57 30%);
      }
      .preview-content ul, .preview-content ol {
        margin-bottom: 16px;
        padding-left: 30px;
      }
      .preview-content li {
        margin-bottom: 8px;
      }
      .preview-content ul li::marker {
        content: "→ ";
        color: #ff6b6b;
        font-weight: bold;
      }
      .preview-content hr {
        border: none;
        height: 3px;
        background: linear-gradient(to right, #ff6b6b, #feca57, #54a0ff, #ff9ff3);
        margin: 30px 0;
        border-radius: 2px;
      }
    `
  },

  academic: {
    name: 'Academic',
    css: `
      .preview-content {
        font-family: 'Times New Roman', 'Georgia', serif;
        line-height: 1.7;
        color: #2c2c2c;
        max-width: 750px;
        margin: 0 auto;
        padding: 40px 30px;
        background: #ffffff;
      }
      .preview-content p, .preview-content div, .preview-content span, .preview-content li, .preview-content td {
        color: #2c2c2c;
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        font-family: 'Times New Roman', 'Georgia', serif;
        margin-top: 36px;
        margin-bottom: 18px;
        font-weight: 700;
        color: #1a1a1a;
      }
      .preview-content h1 { 
        font-size: 2.4em; 
        text-align: center;
        margin-bottom: 24px;
        border-bottom: 2px solid #8b0000;
        padding-bottom: 12px;
      }
      .preview-content h2 { 
        font-size: 1.8em; 
        color: #8b0000;
        border-bottom: 1px solid #cccccc;
        padding-bottom: 8px;
      }
      .preview-content h3 { font-size: 1.4em; color: #444444; }
      .preview-content h4 { font-size: 1.2em; color: #666666; }
      .preview-content p {
        margin-bottom: 16px;
        text-align: justify;
        text-indent: 1.5em;
      }
      .preview-content p:first-of-type, .preview-content h1 + p, .preview-content h2 + p, .preview-content h3 + p {
        text-indent: 0;
      }
      .preview-content pre {
        background: #f8f8f8;
        border: 1px solid #dddddd;
        padding: 16px;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
        line-height: 1.4;
        margin: 20px 0;
      }
      .preview-content code {
        background: #f0f0f0;
        padding: 2px 4px;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
        color: #8b0000;
      }
      .preview-content blockquote {
        border-left: 4px solid #8b0000;
        padding-left: 20px;
        margin: 24px 0;
        font-style: italic;
        color: #555555;
      }
      .preview-content table {
        border-collapse: collapse;
        margin: 24px auto;
        width: 100%;
        border: 2px solid #8b0000;
      }
      .preview-content table th {
        background: #8b0000;
        color: white;
        padding: 12px;
        font-weight: bold;
        text-align: left;
      }
      .preview-content table td {
        padding: 10px 12px;
        border: 1px solid #cccccc;
      }
      .preview-content table tr:nth-child(even) {
        background: #f9f9f9;
      }
      .preview-content ul, .preview-content ol {
        margin: 16px 0;
        padding-left: 30px;
      }
      .preview-content li {
        margin-bottom: 8px;
      }
      .preview-content a {
        color: #8b0000;
        text-decoration: underline;
      }
      .preview-content a:hover {
        color: #cc0000;
      }
      .preview-content img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 24px auto;
        border: 1px solid #dddddd;
      }
    `
  },

  technical: {
    name: 'Technical',
    css: `
      .preview-content {
        font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
        line-height: 1.6;
        color: #333333;
        max-width: 900px;
        margin: 0 auto;
        padding: 30px;
        background: #ffffff;
      }
      .preview-content p, .preview-content div, .preview-content span, .preview-content li, .preview-content td {
        color: #333333;
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        margin-top: 32px;
        margin-bottom: 16px;
        font-weight: 600;
        color: #0066cc;
        background: #f0f7ff;
        padding: 8px 12px;
        border-left: 4px solid #0066cc;
      }
      .preview-content h1 { 
        font-size: 1.8em; 
        text-transform: uppercase;
        letter-spacing: 1px;
        background: #0066cc;
        color: white;
        text-align: center;
        border: none;
      }
      .preview-content h2 { font-size: 1.5em; }
      .preview-content h3 { font-size: 1.3em; }
      .preview-content h4 { font-size: 1.1em; }
      .preview-content p {
        margin-bottom: 16px;
      }
      .preview-content pre {
        background: #1e1e1e;
        color: #d4d4d4;
        padding: 20px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 0.9em;
        line-height: 1.5;
        margin: 20px 0;
        border: 1px solid #333333;
        border-radius: 4px;
      }
      .preview-content code {
        background: #f0f0f0;
        padding: 2px 6px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 0.9em;
        color: #0066cc;
        border: 1px solid #cccccc;
        border-radius: 3px;
      }
      .preview-content blockquote {
        border-left: 4px solid #ffcc00;
        background: #fffbf0;
        padding: 16px 20px;
        margin: 20px 0;
        color: #664400;
        border-radius: 0 4px 4px 0;
      }
      .preview-content blockquote:before {
        content: "⚠️ ";
        font-weight: bold;
      }
      .preview-content table {
        border-collapse: collapse;
        margin: 24px 0;
        width: 100%;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 0.9em;
      }
      .preview-content table th {
        background: #0066cc;
        color: white;
        padding: 10px 12px;
        font-weight: bold;
        text-align: left;
        border: 1px solid #0066cc;
      }
      .preview-content table td {
        padding: 8px 12px;
        border: 1px solid #cccccc;
      }
      .preview-content table tr:nth-child(even) {
        background: #f8f8f8;
      }
      .preview-content ul, .preview-content ol {
        margin: 16px 0;
        padding-left: 25px;
      }
      .preview-content li {
        margin-bottom: 6px;
      }
      .preview-content a {
        color: #0066cc;
        text-decoration: none;
        font-weight: 500;
      }
      .preview-content a:hover {
        text-decoration: underline;
      }
      .preview-content img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 20px auto;
        border: 2px solid #0066cc;
      }
    `
  },

  minimalist: {
    name: 'Minimalist',
    css: `
      .preview-content {
        font-family: 'Helvetica Neue', 'Arial', sans-serif;
        line-height: 1.8;
        color: #444444;
        max-width: 680px;
        margin: 0 auto;
        padding: 60px 40px;
        background: #ffffff;
      }
      .preview-content p, .preview-content div, .preview-content span, .preview-content li, .preview-content td {
        color: #444444;
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        font-family: 'Helvetica Neue', 'Arial', sans-serif;
        margin-top: 48px;
        margin-bottom: 24px;
        font-weight: 300;
        color: #222222;
      }
      .preview-content h1 { 
        font-size: 2.5em; 
        text-align: center;
        margin-bottom: 48px;
        font-weight: 100;
        letter-spacing: -1px;
      }
      .preview-content h2 { 
        font-size: 1.8em; 
        margin-top: 60px;
        font-weight: 200;
      }
      .preview-content h3 { font-size: 1.4em; }
      .preview-content h4 { font-size: 1.2em; }
      .preview-content p {
        margin-bottom: 24px;
        font-size: 16px;
      }
      .preview-content pre {
        background: #fafafa;
        border: 1px solid #eeeeee;
        padding: 24px;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 0.85em;
        line-height: 1.6;
        margin: 32px 0;
        color: #666666;
      }
      .preview-content code {
        background: #f5f5f5;
        padding: 3px 6px;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 0.9em;
        color: #666666;
      }
      .preview-content blockquote {
        border-left: 2px solid #cccccc;
        padding-left: 24px;
        margin: 32px 0;
        font-style: italic;
        color: #777777;
        font-size: 1.1em;
      }
      .preview-content table {
        border-collapse: collapse;
        margin: 32px auto;
        width: 100%;
      }
      .preview-content table th {
        background: #f8f8f8;
        padding: 16px;
        font-weight: 500;
        text-align: left;
        border-bottom: 2px solid #eeeeee;
        color: #555555;
      }
      .preview-content table td {
        padding: 16px;
        border-bottom: 1px solid #eeeeee;
      }
      .preview-content ul, .preview-content ol {
        margin: 24px 0;
        padding-left: 24px;
      }
      .preview-content li {
        margin-bottom: 12px;
      }
      .preview-content a {
        color: #666666;
        text-decoration: none;
        border-bottom: 1px solid #cccccc;
      }
      .preview-content a:hover {
        color: #333333;
        border-bottom-color: #999999;
      }
      .preview-content img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 48px auto;
      }
    `
  },

  classic: {
    name: 'Classic',
    css: `
      .preview-content {
        font-family: 'Baskerville', 'Georgia', 'Times New Roman', serif;
        line-height: 1.6;
        color: #1a1a1a;
        max-width: 700px;
        margin: 0 auto;
        padding: 40px 35px;
        background: #fffef8;
        border: 1px solid #e8e1d4;
      }
      .preview-content p, .preview-content div, .preview-content span, .preview-content li, .preview-content td {
        color: #1a1a1a;
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        font-family: 'Baskerville', 'Georgia', 'Times New Roman', serif;
        margin-top: 32px;
        margin-bottom: 16px;
        font-weight: normal;
        color: #2c1810;
      }
      .preview-content h1 { 
        font-size: 2.2em; 
        text-align: center;
        margin-bottom: 32px;
        border-bottom: 3px double #8b4513;
        padding-bottom: 16px;
        font-variant: small-caps;
        letter-spacing: 1px;
      }
      .preview-content h2 { 
        font-size: 1.6em; 
        margin-top: 40px;
        font-variant: small-caps;
        color: #8b4513;
      }
      .preview-content h3 { font-size: 1.3em; font-style: italic; }
      .preview-content h4 { font-size: 1.1em; font-variant: small-caps; }
      .preview-content p {
        margin-bottom: 16px;
        text-align: justify;
        text-indent: 2em;
      }
      .preview-content p:first-of-type,
      .preview-content h1 + p,
      .preview-content h2 + p,
      .preview-content h3 + p {
        text-indent: 0;
      }
      .preview-content p:first-letter {
        font-size: 1.3em;
        font-weight: bold;
        color: #8b4513;
      }
      .preview-content pre {
        background: #f5f5f0;
        border: 1px solid #d4c4a8;
        padding: 16px;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
        line-height: 1.4;
        margin: 24px 0;
        color: #5d4e37;
      }
      .preview-content code {
        background: #f0f0e8;
        padding: 2px 4px;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
        color: #8b4513;
        border: 1px solid #d4c4a8;
      }
      .preview-content blockquote {
        border-left: 4px solid #8b4513;
        padding-left: 24px;
        margin: 24px 0;
        font-style: italic;
        color: #5d4e37;
        background: #faf9f5;
        padding: 16px 24px;
      }
      .preview-content blockquote:before {
        content: """;
        font-size: 3em;
        color: #8b4513;
        float: left;
        margin: -10px 10px 0 -10px;
        font-family: serif;
      }
      .preview-content table {
        border-collapse: collapse;
        margin: 24px auto;
        width: 100%;
        border: 2px solid #8b4513;
        background: #fffef8;
      }
      .preview-content table th {
        background: #8b4513;
        color: #fffef8;
        padding: 12px;
        font-weight: bold;
        text-align: center;
        font-variant: small-caps;
      }
      .preview-content table td {
        padding: 10px 12px;
        border: 1px solid #d4c4a8;
        text-align: center;
      }
      .preview-content table tr:nth-child(even) {
        background: #faf9f5;
      }
      .preview-content ul, .preview-content ol {
        margin: 16px 0;
        padding-left: 40px;
      }
      .preview-content li {
        margin-bottom: 8px;
      }
      .preview-content a {
        color: #8b4513;
        text-decoration: none;
        border-bottom: 1px dotted #8b4513;
      }
      .preview-content a:hover {
        color: #a0522d;
        border-bottom-style: solid;
      }
      .preview-content img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 24px auto;
        border: 3px solid #8b4513;
        padding: 4px;
        background: white;
      }
      .preview-content hr {
        border: none;
        text-align: center;
        margin: 32px 0;
      }
      .preview-content hr:after {
        content: "❦";
        font-size: 1.5em;
        color: #8b4513;
      }
    `
  },

  report: {
    name: 'Report',
    css: `
      .preview-content {
        font-family: 'Calibri', 'Arial', sans-serif;
        line-height: 1.5;
        color: #2c2c2c;
        max-width: 850px;
        margin: 0 auto;
        padding: 40px;
        background: #ffffff;
        border: 1px solid #e0e0e0;
      }
      .preview-content p, .preview-content div, .preview-content span, .preview-content li, .preview-content td {
        color: #2c2c2c;
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        font-family: 'Calibri', 'Arial', sans-serif;
        margin-top: 32px;
        margin-bottom: 16px;
        font-weight: 600;
        color: #1f4e79;
      }
      .preview-content h1 { 
        font-size: 2.2em; 
        text-align: center;
        margin-bottom: 32px;
        background: #1f4e79;
        color: white;
        padding: 20px;
        margin-left: -40px;
        margin-right: -40px;
        margin-top: 0;
      }
      .preview-content h2 { 
        font-size: 1.6em; 
        background: #e7f3ff;
        padding: 12px 16px;
        margin-left: -20px;
        margin-right: -20px;
        border-left: 5px solid #1f4e79;
      }
      .preview-content h3 { 
        font-size: 1.3em; 
        color: #2e5984;
        border-bottom: 2px solid #70ad47;
        padding-bottom: 4px;
      }
      .preview-content h4 { font-size: 1.1em; color: #2e5984; }
      .preview-content p {
        margin-bottom: 14px;
        text-align: justify;
      }
      .preview-content pre {
        background: #f8f8f8;
        border: 1px solid #d0d0d0;
        border-left: 4px solid #70ad47;
        padding: 16px;
        font-family: 'Consolas', 'Courier New', monospace;
        font-size: 0.9em;
        line-height: 1.4;
        margin: 20px 0;
        color: #2c2c2c;
      }
      .preview-content code {
        background: #f0f0f0;
        padding: 2px 6px;
        font-family: 'Consolas', 'Courier New', monospace;
        font-size: 0.9em;
        color: #1f4e79;
        border: 1px solid #d0d0d0;
        border-radius: 2px;
      }
      .preview-content blockquote {
        border-left: 4px solid #70ad47;
        background: #f0f8f0;
        padding: 16px 20px;
        margin: 20px 0;
        color: #2c5234;
        font-style: italic;
      }
      .preview-content blockquote:before {
        content: "💡 ";
        font-style: normal;
        font-weight: bold;
      }
      .preview-content table {
        border-collapse: collapse;
        margin: 24px 0;
        width: 100%;
        border: 2px solid #1f4e79;
        font-size: 0.95em;
      }
      .preview-content table th {
        background: #1f4e79;
        color: white;
        padding: 12px;
        font-weight: 600;
        text-align: left;
        border: 1px solid #1f4e79;
      }
      .preview-content table td {
        padding: 10px 12px;
        border: 1px solid #d0d0d0;
      }
      .preview-content table tr:nth-child(even) {
        background: #f8f9fa;
      }
      .preview-content table tr:hover {
        background: #e7f3ff;
      }
      .preview-content ul, .preview-content ol {
        margin: 16px 0;
        padding-left: 25px;
      }
      .preview-content li {
        margin-bottom: 8px;
      }
      .preview-content ul li::marker {
        color: #70ad47;
      }
      .preview-content ol li::marker {
        color: #1f4e79;
        font-weight: bold;
      }
      .preview-content a {
        color: #1f4e79;
        text-decoration: none;
        font-weight: 500;
      }
      .preview-content a:hover {
        color: #2e5984;
        text-decoration: underline;
      }
      .preview-content img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 24px auto;
        border: 2px solid #1f4e79;
        padding: 8px;
        background: white;
      }
      .preview-content strong {
        color: #1f4e79;
        font-weight: 600;
      }
      .preview-content em {
        color: #70ad47;
        font-style: italic;
      }
    `
  }
};

// Helper function to get style CSS by name
export function getStyleCSS(styleName) {
  const baseCSS = previewStyles[styleName]?.css || previewStyles.standard.css;
  return baseCSS;
}

// Helper function to get all style names
export function getStyleNames() {
  return Object.keys(previewStyles).map(key => ({
    value: key,
    label: previewStyles[key].name
  }));
}