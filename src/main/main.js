const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { exportToPDF, exportToHTML, exportToEPUB, exportToDOCX } = require('./exportUtils');
const preferencesManager = require('./preferences');

let mainWindow;
let fileToOpen = null; // Store file to open if app isn't ready yet

// Embedded theme styles for export functions to avoid module loading issues in production
function getThemeCSS(themeName) {
  const themes = {
    standard: `
      .preview-content {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        margin-top: 24px;
        margin-bottom: 16px;
        font-weight: 600;
      }
      .preview-content h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
      .preview-content h2 { font-size: 1.5em; }
      .preview-content h3 { font-size: 1.25em; }
      .preview-content pre {
        background-color: #f6f8fa;
        padding: 16px;
        overflow: auto;
        border-radius: 6px;
      }
      .preview-content code {
        background-color: #f6f8fa;
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-size: 85%;
      }
      .preview-content blockquote {
        border-left: 4px solid #dfe2e5;
        padding-left: 16px;
        margin-left: 0;
        color: #6a737d;
      }
      .preview-content table {
        border-collapse: collapse;
        margin: 16px 0;
      }
      .preview-content table th, .preview-content table td {
        border: 1px solid #dfe2e5;
        padding: 6px 13px;
      }
      .preview-content table tr:nth-child(2n) {
        background-color: #f6f8fa;
      }
      .preview-content img { max-width: 100%; height: auto; }
      .preview-content a { color: #0366d6; text-decoration: none; }
      .preview-content a:hover { text-decoration: underline; }
    `,
    modern: `
      .preview-content {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.8;
        color: #1a1a1a;
        max-width: 900px;
        margin: 0 auto;
        padding: 40px 20px;
        background: #fafafa;
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
        padding: 20px;
        border-radius: 10px;
        overflow-x: auto;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      .preview-content code {
        background: #edf2f7;
        color: #805ad5;
        padding: 0.25em 0.5em;
        border-radius: 4px;
        font-family: 'Fira Code', monospace;
      }
      .preview-content blockquote {
        border-left: 5px solid #667eea;
        padding-left: 20px;
        margin: 20px 0;
        background: #f7fafc;
        padding: 20px;
        border-radius: 5px;
        font-style: italic;
      }
      .preview-content table {
        border-collapse: separate;
        border-spacing: 0;
        margin: 20px 0;
        overflow: hidden;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .preview-content table th, .preview-content table td {
        border-right: 1px solid #e2e8f0;
        border-bottom: 1px solid #e2e8f0;
        padding: 12px 16px;
      }
      .preview-content table th {
        background: #667eea;
        color: white;
        font-weight: 600;
      }
      .preview-content table tr:nth-child(2n) {
        background-color: #f7fafc;
      }
      .preview-content img { 
        max-width: 100%; 
        height: auto; 
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .preview-content a { 
        color: #667eea; 
        text-decoration: none;
        border-bottom: 2px solid transparent;
        transition: border-color 0.2s;
      }
      .preview-content a:hover { 
        border-bottom-color: #667eea;
      }
    `,
    manuscript: `
      .preview-content {
        font-family: 'Georgia', 'Times New Roman', serif;
        line-height: 2;
        color: #2c3e50;
        max-width: 700px;
        margin: 0 auto;
        padding: 40px 20px;
        background: #fffef8;
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        font-family: 'Garamond', 'Georgia', serif;
        margin-top: 30px;
        margin-bottom: 15px;
        font-weight: 400;
        color: #1a252f;
      }
      .preview-content h1 { font-size: 2.5em; text-align: center; margin: 40px 0; }
      .preview-content h2 { font-size: 2em; }
      .preview-content h3 { font-size: 1.6em; }
      .preview-content p {
        text-indent: 2em;
        margin-bottom: 1em;
        text-align: justify;
      }
      .preview-content pre {
        background-color: #f9f7f3;
        padding: 20px;
        border-left: 3px solid #8b7355;
        font-family: 'Courier New', monospace;
      }
      .preview-content code {
        background-color: #f9f7f3;
        padding: 0.2em 0.4em;
        font-family: 'Courier New', monospace;
      }
      .preview-content blockquote {
        font-style: italic;
        margin: 30px 40px;
        padding: 0;
        quotes: "\\201C""\\201D""\\2018""\\2019";
      }
      .preview-content blockquote:before {
        content: open-quote;
        font-size: 3em;
        line-height: 0.1em;
        margin-right: 0.25em;
        vertical-align: -0.4em;
      }
      .preview-content table {
        border-collapse: collapse;
        margin: 30px auto;
        font-size: 0.95em;
      }
      .preview-content table th, .preview-content table td {
        border: 1px solid #8b7355;
        padding: 10px 15px;
      }
      .preview-content table th {
        background-color: #f9f7f3;
        font-weight: 600;
      }
    `,
    business: `
      .preview-content {
        font-family: 'Calibri', 'Arial', sans-serif;
        line-height: 1.5;
        color: #212529;
        max-width: 850px;
        margin: 0 auto;
        padding: 30px;
        background: white;
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        font-family: 'Arial', sans-serif;
        margin-top: 20px;
        margin-bottom: 10px;
        font-weight: bold;
        color: #003366;
      }
      .preview-content h1 { font-size: 24pt; border-bottom: 2px solid #003366; padding-bottom: 10px; }
      .preview-content h2 { font-size: 18pt; }
      .preview-content h3 { font-size: 14pt; }
      .preview-content pre {
        background-color: #f5f5f5;
        padding: 15px;
        border: 1px solid #ccc;
        font-family: 'Consolas', monospace;
      }
      .preview-content code {
        background-color: #f5f5f5;
        padding: 2px 4px;
        font-family: 'Consolas', monospace;
      }
      .preview-content blockquote {
        border-left: 4px solid #003366;
        padding-left: 15px;
        margin: 15px 0;
        color: #555;
      }
      .preview-content table {
        border-collapse: collapse;
        margin: 20px 0;
        width: 100%;
      }
      .preview-content table th, .preview-content table td {
        border: 1px solid #003366;
        padding: 8px 12px;
        text-align: left;
      }
      .preview-content table th {
        background-color: #003366;
        color: white;
        font-weight: bold;
      }
      .preview-content table tr:nth-child(even) {
        background-color: #f0f0f0;
      }
      .preview-content ul, .preview-content ol {
        padding-left: 25px;
      }
      .preview-content li {
        margin-bottom: 5px;
      }
    `,
    informal: `
      .preview-content {
        font-family: 'Comic Sans MS', 'Arial', sans-serif;
        line-height: 1.7;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 30px;
        background: linear-gradient(135deg, #fff5e6 0%, #ffe6f0 100%);
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        margin-top: 25px;
        margin-bottom: 15px;
        font-weight: bold;
        color: #ff6b6b;
      }
      .preview-content h1 { 
        font-size: 2.5em; 
        text-align: center;
        color: #ff6b6b;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
      }
      .preview-content h2 { font-size: 2em; color: #4ecdc4; }
      .preview-content h3 { font-size: 1.6em; color: #45b7d1; }
      .preview-content pre {
        background: #fff;
        padding: 20px;
        border-radius: 15px;
        border: 2px dashed #ff6b6b;
        overflow-x: auto;
      }
      .preview-content code {
        background: #ffeb3b;
        padding: 0.3em 0.5em;
        border-radius: 5px;
        font-family: monospace;
      }
      .preview-content blockquote {
        border-left: 5px solid #ff6b6b;
        padding-left: 20px;
        margin: 20px 0;
        background: rgba(255, 255, 255, 0.8);
        padding: 15px 20px;
        border-radius: 10px;
        font-style: italic;
      }
      .preview-content table {
        border-collapse: separate;
        border-spacing: 5px;
        margin: 20px 0;
      }
      .preview-content table th, .preview-content table td {
        padding: 10px;
        background: white;
        border-radius: 10px;
      }
      .preview-content table th {
        background: #ff6b6b;
        color: white;
        font-weight: bold;
      }
      .preview-content a {
        color: #ff6b6b;
        text-decoration: none;
        border-bottom: 2px dotted #ff6b6b;
      }
      .preview-content a:hover {
        background: #ffeb3b;
      }
    `,
    academic: `
      .preview-content {
        font-family: 'Times New Roman', serif;
        line-height: 1.8;
        color: #000;
        max-width: 750px;
        margin: 0 auto;
        padding: 40px;
        background: white;
        font-size: 12pt;
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        font-family: 'Times New Roman', serif;
        margin-top: 20px;
        margin-bottom: 10px;
        font-weight: bold;
        color: #000;
      }
      .preview-content h1 { font-size: 14pt; text-align: center; text-transform: uppercase; }
      .preview-content h2 { font-size: 12pt; text-transform: uppercase; }
      .preview-content h3 { font-size: 12pt; font-style: italic; }
      .preview-content p {
        text-align: justify;
        text-indent: 0.5in;
        margin-bottom: 12pt;
      }
      .preview-content pre {
        background-color: #f5f5f5;
        padding: 10px;
        border: 1px solid #000;
        font-family: 'Courier New', monospace;
        font-size: 10pt;
      }
      .preview-content code {
        font-family: 'Courier New', monospace;
        font-size: 10pt;
      }
      .preview-content blockquote {
        margin-left: 0.5in;
        margin-right: 0.5in;
        font-size: 10pt;
        line-height: 1.5;
      }
      .preview-content table {
        border-collapse: collapse;
        margin: 20px auto;
        font-size: 10pt;
      }
      .preview-content table th, .preview-content table td {
        border: 1px solid #000;
        padding: 5px 10px;
        text-align: left;
      }
      .preview-content table th {
        font-weight: bold;
      }
      .preview-content a {
        color: #000;
        text-decoration: underline;
      }
      .preview-content .citation {
        margin-left: 0.5in;
        text-indent: -0.5in;
      }
    `,
    technical: `
      .preview-content {
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
        line-height: 1.6;
        color: #e0e0e0;
        max-width: 900px;
        margin: 0 auto;
        padding: 30px;
        background: #1e1e1e;
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
        margin-top: 30px;
        margin-bottom: 15px;
        font-weight: 600;
        color: #61dafb;
      }
      .preview-content h1 { font-size: 2.5em; border-bottom: 2px solid #61dafb; padding-bottom: 10px; }
      .preview-content h2 { font-size: 2em; color: #98c379; }
      .preview-content h3 { font-size: 1.6em; color: #e06c75; }
      .preview-content pre {
        background: #282c34;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #3e4451;
        overflow-x: auto;
        font-size: 14px;
      }
      .preview-content code {
        background: #282c34;
        color: #abb2bf;
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-size: 0.9em;
      }
      .preview-content blockquote {
        border-left: 4px solid #61dafb;
        padding-left: 20px;
        margin: 20px 0;
        color: #abb2bf;
        font-style: italic;
      }
      .preview-content table {
        border-collapse: collapse;
        margin: 20px 0;
        width: 100%;
      }
      .preview-content table th, .preview-content table td {
        border: 1px solid #3e4451;
        padding: 10px;
        text-align: left;
      }
      .preview-content table th {
        background: #282c34;
        color: #61dafb;
        font-weight: 600;
      }
      .preview-content table tr:nth-child(even) {
        background: #282c34;
      }
      .preview-content a {
        color: #61dafb;
        text-decoration: none;
      }
      .preview-content a:hover {
        text-decoration: underline;
      }
      .preview-content ::selection {
        background: #3e4451;
        color: #fff;
      }
    `,
    minimalist: `
      .preview-content {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.8;
        color: #111;
        max-width: 650px;
        margin: 0 auto;
        padding: 60px 20px;
        background: #fff;
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        font-weight: 300;
        margin-top: 40px;
        margin-bottom: 20px;
        letter-spacing: -0.02em;
      }
      .preview-content h1 { font-size: 2.5em; font-weight: 200; }
      .preview-content h2 { font-size: 1.8em; }
      .preview-content h3 { font-size: 1.4em; }
      .preview-content p {
        margin-bottom: 20px;
      }
      .preview-content pre {
        background: #f7f7f7;
        padding: 20px;
        border: none;
        overflow-x: auto;
      }
      .preview-content code {
        background: #f7f7f7;
        padding: 0.2em 0.4em;
        font-size: 0.9em;
      }
      .preview-content blockquote {
        border-left: 2px solid #111;
        padding-left: 20px;
        margin: 30px 0;
        font-style: italic;
      }
      .preview-content table {
        border-collapse: collapse;
        margin: 30px 0;
        width: 100%;
      }
      .preview-content table th, .preview-content table td {
        border-bottom: 1px solid #eee;
        padding: 12px 0;
        text-align: left;
      }
      .preview-content table th {
        font-weight: 600;
        border-bottom: 2px solid #111;
      }
      .preview-content a {
        color: #111;
        text-decoration: none;
        border-bottom: 1px solid #111;
      }
      .preview-content a:hover {
        border-bottom: 2px solid #111;
      }
      .preview-content hr {
        border: none;
        border-top: 1px solid #eee;
        margin: 40px 0;
      }
    `,
    classic: `
      .preview-content {
        font-family: 'Book Antiqua', 'Palatino', serif;
        line-height: 1.7;
        color: #2c2c2c;
        max-width: 700px;
        margin: 0 auto;
        padding: 40px;
        background: #f5f5dc;
        border: 1px solid #d4d4aa;
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        font-family: 'Book Antiqua', 'Palatino', serif;
        margin-top: 25px;
        margin-bottom: 15px;
        font-weight: normal;
        color: #4a4a4a;
      }
      .preview-content h1 { 
        font-size: 2.2em; 
        text-align: center; 
        border-top: 3px double #8b7355;
        border-bottom: 3px double #8b7355;
        padding: 15px 0;
        margin: 30px 0;
      }
      .preview-content h2 { font-size: 1.8em; border-bottom: 1px solid #8b7355; padding-bottom: 5px; }
      .preview-content h3 { font-size: 1.5em; font-style: italic; }
      .preview-content p {
        text-align: justify;
        margin-bottom: 15px;
      }
      .preview-content pre {
        background: #efefd6;
        padding: 15px;
        border: 1px solid #8b7355;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
      }
      .preview-content code {
        background: #efefd6;
        padding: 0.2em 0.4em;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
      }
      .preview-content blockquote {
        border-left: 3px solid #8b7355;
        padding-left: 20px;
        margin: 20px 10px;
        font-style: italic;
        color: #5a5a5a;
      }
      .preview-content table {
        border-collapse: collapse;
        margin: 20px auto;
        width: 90%;
      }
      .preview-content table th, .preview-content table td {
        border: 1px solid #8b7355;
        padding: 8px 12px;
      }
      .preview-content table th {
        background: #d4d4aa;
        font-weight: bold;
      }
      .preview-content a {
        color: #8b4513;
        text-decoration: none;
      }
      .preview-content a:hover {
        text-decoration: underline;
      }
    `,
    report: `
      .preview-content {
        font-family: 'Arial', sans-serif;
        line-height: 1.6;
        color: #000;
        max-width: 800px;
        margin: 0 auto;
        padding: 40px;
        background: white;
        font-size: 11pt;
      }
      .preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
        font-family: 'Arial', sans-serif;
        margin-top: 20px;
        margin-bottom: 10px;
        font-weight: bold;
        color: #000;
      }
      .preview-content h1 { 
        font-size: 16pt; 
        text-align: center;
        margin: 30px 0;
        text-transform: uppercase;
      }
      .preview-content h2 { 
        font-size: 14pt; 
        border-bottom: 1px solid #000;
        padding-bottom: 5px;
      }
      .preview-content h3 { font-size: 12pt; }
      .preview-content p {
        text-align: justify;
        margin-bottom: 10pt;
      }
      .preview-content pre {
        background: #f0f0f0;
        padding: 10px;
        border: 1px solid #999;
        font-family: 'Courier New', monospace;
        font-size: 9pt;
      }
      .preview-content code {
        font-family: 'Courier New', monospace;
        font-size: 9pt;
        background: #f0f0f0;
        padding: 1px 3px;
      }
      .preview-content blockquote {
        margin-left: 0.5in;
        margin-right: 0.5in;
        padding: 10px;
        background: #f0f0f0;
        border-left: 3px solid #999;
      }
      .preview-content table {
        border-collapse: collapse;
        margin: 15px 0;
        width: 100%;
        font-size: 10pt;
      }
      .preview-content table th, .preview-content table td {
        border: 1px solid #000;
        padding: 5px 8px;
        text-align: left;
      }
      .preview-content table th {
        background: #e0e0e0;
        font-weight: bold;
        text-align: center;
      }
      .preview-content table caption {
        font-weight: bold;
        margin-bottom: 5px;
      }
      .preview-content a {
        color: #000;
        text-decoration: underline;
      }
      .preview-content .page-break {
        page-break-after: always;
      }
      .preview-content strong {
        font-weight: bold;
      }
      .preview-content em {
        font-style: italic;
      }
    `
  };
  
  // Return the requested theme or fall back to standard
  return themes[themeName] || themes.standard;
}

function createWindow() {
  console.log('Creating Electron window...');
  
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js')
    },
    show: false
  });

  console.log('Window created, loading URL...');
  
  // Store window reference
  mainWindow = win;
  
  // Handle window close event
  win.on('close', async (event) => {
    if (!forceQuit && !isQuitting) {
      event.preventDefault();
      // Trigger the app quit flow which will check for unsaved changes
      app.quit();
    }
  });
  
  // Handle file opening after window loads
  win.webContents.once('did-finish-load', () => {
    // Small delay to ensure renderer is fully ready
    setTimeout(() => {
      if (fileToOpen) {
        console.log('Opening file after window load:', fileToOpen);
        win.webContents.send('menu-open-file', fileToOpen);
        fileToOpen = null; // Clear the file path
      }
    }, 500);
  });
  
  // Load from dist folder instead of dev server for now
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:8080')
      .then(() => {
        console.log('Successfully loaded URL');
        win.webContents.openDevTools(); // Open DevTools
        win.show();
      })
      .catch(error => {
        console.error('Failed to load URL:', error);
        win.webContents.openDevTools(); // Open DevTools even on error
        win.show();
      });
  } else {
    // In production, the app is packaged differently
    let indexPath;
    if (app.isPackaged) {
      // In the packaged app, dist files are in the app directory
      indexPath = path.join(__dirname, '../../dist/index.html');
    } else {
      // Running with electron . (not packaged)
      indexPath = path.join(__dirname, '../../dist/index.html');
    }
    
    console.log('Loading index.html from:', indexPath);
    
    win.loadFile(indexPath)
      .then(() => {
        console.log('Successfully loaded file');
        // DevTools disabled for production
        // win.webContents.openDevTools(); 
        win.show();
      })
      .catch(error => {
        console.error('Failed to load file:', error);
        // Try alternative path as fallback
        const altPath = path.join(__dirname, '../../dist/index.html');
        console.log('Trying alternative path:', altPath);
        win.loadFile(altPath)
          .then(() => {
            console.log('Loaded from alternative path');
            win.show();
          })
          .catch(err => {
            console.error('Alternative path also failed:', err);
            win.show();
          });
      });
  }

  // Show window when ready (backup)
  win.once('ready-to-show', () => {
    console.log('Window ready to show');
    win.show();
  });

  // Log when window is shown
  win.once('show', () => {
    console.log('Window is now visible');
  });

  // Prevent crashes from closing the window
  win.webContents.on('crashed', (event, killed) => {
    console.error('Renderer process crashed, killed:', killed);
    // Don't close window, try to reload instead
    win.reload();
  });

  win.webContents.on('unresponsive', () => {
    console.error('Renderer process became unresponsive');
  });

  win.webContents.on('responsive', () => {
    console.log('Renderer process became responsive again');
  });

  // Track windows
  win.on('closed', () => {
    console.log('Window closed');
    mainWindow = null;
  });

  return win;
}

// Create application menu
async function createMenu() {
  // Get recent files and folders
  const recentFiles = await preferencesManager.getRecentFiles();
  const recentFolders = await preferencesManager.getRecentFolders();
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            console.log('New File menu clicked');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-new-file');
            } else {
              // Create new window if none exists
              mainWindow = createWindow();
            }
          }
        },
        {
          label: 'New File from Template...',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            console.log('New File from Template menu clicked');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-new-file-from-template');
            } else {
              // Create new window if none exists
              mainWindow = createWindow();
            }
          }
        },
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            console.log('Open File menu clicked');
            
            // Create window if none exists
            if (!mainWindow || mainWindow.isDestroyed()) {
              mainWindow = createWindow();
              // Wait a bit for window to be ready
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'Markdown Files', extensions: ['md', 'markdown', 'txt'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });
            
            console.log('Dialog result:', result);
            
            if (!result.canceled && result.filePaths.length > 0) {
              console.log('Sending file path to renderer:', result.filePaths[0]);
              mainWindow.webContents.send('menu-open-file', result.filePaths[0]);
              
              // Add to recent files
              await preferencesManager.addRecentFile(result.filePaths[0]);
              await createMenu(); // Rebuild menu to show updated recent files
            }
          }
        },
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            console.log('Open Folder menu clicked');
            
            // Create window if none exists
            if (!mainWindow || mainWindow.isDestroyed()) {
              mainWindow = createWindow();
              // Wait a bit for window to be ready
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory'],
              buttonLabel: 'Open Folder'
            });
            
            console.log('Folder dialog result:', result);
            
            if (!result.canceled && result.filePaths.length > 0) {
              console.log('Sending folder path to renderer:', result.filePaths[0]);
              mainWindow.webContents.send('menu-open-folder', result.filePaths[0]);
              
              // Add to recent folders
              await preferencesManager.addRecentFolder(result.filePaths[0]);
              await createMenu(); // Rebuild menu to show updated recent folders
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Recent Files',
          submenu: recentFiles.length > 0 ? [
            ...recentFiles.map(filePath => ({
              label: path.basename(filePath),
              sublabel: path.dirname(filePath),
              click: async () => {
                console.log('Opening recent file:', filePath);
                
                // Create window if none exists
                if (!mainWindow || mainWindow.isDestroyed()) {
                  mainWindow = createWindow();
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                // Send file path to renderer
                mainWindow.webContents.send('menu-open-file', filePath);
              }
            })),
            { type: 'separator' },
            {
              label: 'Clear Recent Files',
              click: async () => {
                await preferencesManager.clearRecentFiles();
                // Rebuild menu
                await createMenu();
              }
            }
          ] : [
            { label: 'No Recent Files', enabled: false }
          ]
        },
        {
          label: 'Recent Folders',
          submenu: recentFolders.length > 0 ? [
            ...recentFolders.map(folderPath => ({
              label: path.basename(folderPath),
              sublabel: path.dirname(folderPath),
              click: async () => {
                console.log('Opening recent folder:', folderPath);
                
                // Create window if none exists
                if (!mainWindow || mainWindow.isDestroyed()) {
                  mainWindow = createWindow();
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                // Send folder path to renderer
                mainWindow.webContents.send('menu-open-folder', folderPath);
              }
            })),
            { type: 'separator' },
            {
              label: 'Clear Recent Folders',
              click: async () => {
                await preferencesManager.clearRecentFolders();
                // Rebuild menu
                await createMenu();
              }
            }
          ] : [
            { label: 'No Recent Folders', enabled: false }
          ]
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            console.log('Save menu clicked');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-save-file');
            }
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            console.log('Save As menu clicked');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-save-file-as');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Auto Save',
          type: 'checkbox',
          checked: false,
          click: (menuItem) => {
            console.log('Auto save toggled:', menuItem.checked);
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-toggle-autosave', menuItem.checked);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: process.platform === 'darwin' ? 'Cmd+,' : 'Ctrl+,',
          click: () => {
            console.log('Preferences menu clicked');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-show-preferences');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Export',
          submenu: [
            {
              label: 'Export as PDF...',
              click: () => {
                console.log('Export PDF menu clicked');
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send('menu-export-pdf');
                }
              }
            },
            {
              label: 'Export as HTML...',
              click: () => {
                console.log('Export HTML menu clicked');
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send('menu-export-html');
                }
              }
            },
            {
              label: 'Export as EPUB...',
              click: () => {
                console.log('Export EPUB menu clicked');
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send('menu-export-epub');
                }
              }
            },
            {
              label: 'Export as DOCX...',
              click: () => {
                console.log('Export DOCX menu clicked');
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send('menu-export-docx');
                }
              }
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Print...',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            console.log('Print menu clicked');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-print');
            }
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            console.log('Find menu clicked');
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-find');
            } else if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-find');
            }
          }
        },
        {
          label: 'Replace',
          accelerator: process.platform === 'darwin' ? 'Cmd+Option+F' : 'CmdOrCtrl+H',
          click: () => {
            console.log('Replace menu clicked');
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-replace');
            } else if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-replace');
            }
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        {
          label: 'Toggle Explorer',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => {
            console.log('Toggle Explorer menu clicked');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-toggle-explorer');
            }
          }
        },
        {
          label: 'Toggle Preview',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => {
            console.log('Toggle Preview menu clicked');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-toggle-preview');
            }
          }
        },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Help Guide',
          click: () => {
            console.log('Help Guide menu clicked');
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              console.log('Sending menu-show-help to focused window');
              focusedWindow.webContents.send('menu-show-help');
            } else if (mainWindow && !mainWindow.isDestroyed()) {
              console.log('Sending menu-show-help to main window');
              mainWindow.webContents.send('menu-show-help');
            } else {
              console.log('No window available to show help dialog');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'About willisMD',
          click: () => {
            console.log('About menu clicked');
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              console.log('Sending menu-show-about to focused window');
              focusedWindow.webContents.send('menu-show-about');
            } else if (mainWindow && !mainWindow.isDestroyed()) {
              console.log('Sending menu-show-about to main window');
              mainWindow.webContents.send('menu-show-about');
            } else {
              console.log('No window available to show about dialog');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'View Documentation',
          click: () => {
            require('electron').shell.openExternal('https://github.com/stacylacy/willisMD');
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: 'willisMD',
      submenu: [
        { label: 'About willisMD', click: () => {
          console.log('About menu clicked (macOS)');
          const focusedWindow = BrowserWindow.getFocusedWindow();
          if (focusedWindow) {
            console.log('Sending menu-show-about to focused window (macOS)');
            focusedWindow.webContents.send('menu-show-about');
          } else if (mainWindow && !mainWindow.isDestroyed()) {
            console.log('Sending menu-show-about to main window (macOS)');
            mainWindow.webContents.send('menu-show-about');
          } else {
            console.log('No window available to show about dialog (macOS)');
          }
        }},
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'Cmd+,',
          click: () => {
            console.log('Preferences menu clicked (macOS)');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-show-preferences');
            }
          }
        },
        { type: 'separator' },
        { label: 'Services', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: 'Hide willisMD', accelerator: 'Command+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Command+Shift+H', role: 'hideothers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  console.log('Menu created and set');
}

// IPC handlers
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-save-dialog', async () => {
  // Get the focused window or use mainWindow
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  
  if (!win || win.isDestroyed()) {
    return { success: false, error: 'No active window' };
  }
  
  const result = await dialog.showSaveDialog(win, {
    filters: [
      { name: 'Markdown Files', extensions: ['md', 'markdown'] },
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    defaultPath: 'Untitled.md'
  });
  
  if (!result.canceled) {
    return { success: true, filePath: result.filePath };
  }
  return { success: false, canceled: true };
});

ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const result = [];
    
    for (const item of items) {
      // Skip hidden files/folders (starting with .)
      if (item.name.startsWith('.')) continue;
      
      const fullPath = path.join(dirPath, item.name);
      const stats = await fs.stat(fullPath);
      
      result.push({
        name: item.name,
        path: fullPath,
        isDirectory: item.isDirectory(),
        isFile: item.isFile(),
        size: stats.size,
        modified: stats.mtime
      });
    }
    
    // Sort: directories first, then files, alphabetically
    result.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return { success: true, items: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Search in files functionality
ipcMain.handle('search-in-files', async (event, { searchPath, searchTerm, options = {} }) => {
  const results = [];
  const { caseSensitive = false, maxResults = 100 } = options;
  
  async function searchInFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const matches = [];
      
      const searchRegex = caseSensitive 
        ? new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        : new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      
      lines.forEach((line, index) => {
        if (searchRegex.test(line)) {
          matches.push({
            lineNumber: index + 1,
            lineContent: line.trim(),
            preview: line.length > 100 ? line.substring(0, 100) + '...' : line
          });
        }
      });
      
      if (matches.length > 0) {
        return {
          filePath,
          fileName: path.basename(filePath),
          relativePath: path.relative(searchPath, filePath),
          matches: matches.slice(0, 10), // Limit matches per file
          totalMatches: matches.length
        };
      }
    } catch (error) {
      // Silently skip files that can't be read
      console.log('Could not read file:', filePath, error.message);
    }
    return null;
  }
  
  async function searchDirectory(dirPath) {
    if (results.length >= maxResults) return;
    
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        if (results.length >= maxResults) break;
        
        // Skip hidden files and common non-text directories
        if (item.name.startsWith('.') || 
            item.name === 'node_modules' || 
            item.name === 'dist' || 
            item.name === 'build') {
          continue;
        }
        
        const fullPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          await searchDirectory(fullPath);
        } else if (item.isFile()) {
          // Only search in text files
          const ext = path.extname(item.name).toLowerCase();
          const textExtensions = ['.md', '.markdown', '.txt', '.json', '.js', '.html', '.css', '.yml', '.yaml', '.xml'];
          
          if (textExtensions.includes(ext)) {
            const result = await searchInFile(fullPath);
            if (result) {
              results.push(result);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error searching directory:', dirPath, error);
    }
  }
  
  try {
    await searchDirectory(searchPath);
    return { 
      success: true, 
      results, 
      totalFiles: results.length,
      searchTerm,
      searchPath
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Export handlers
ipcMain.handle('export-pdf', async (event, { markdown, title, styleCSS }) => {
  try {
    console.log('=== MAIN PROCESS: PDF export IPC handler called ===');
    console.log('Main process: PDF export requested');
    console.log('Main process: Event sender:', event.sender.id);
    console.log('Main process: Received data keys:', Object.keys({ markdown, title, styleCSS }));
    console.log('Main process: Title:', title);
    console.log('Main process: Markdown length:', markdown ? markdown.length : 'NO MARKDOWN');
    console.log('Main process: Received styleCSS preview (first 200 chars):', styleCSS ? styleCSS.substring(0, 200) : 'NO CSS PROVIDED');
    
    // OVERRIDE: Get the current theme from saved preferences instead of relying on renderer state
    console.log('Main process: Loading current preferences to get actual theme...');
    const currentPrefs = await preferencesManager.load();
    const currentTheme = currentPrefs.previewStyle || 'standard';
    console.log('Main process: Current theme from preferences:', currentTheme);
    
    // Generate CSS for the current theme using embedded function
    const correctCSS = getThemeCSS(currentTheme);
    console.log('Main process: Generated CSS preview (first 200 chars):', correctCSS.substring(0, 200));
    console.log('Main process: Using corrected theme CSS instead of renderer CSS');
    
    // Remove .md extension if present
    const cleanTitle = (title || 'document').replace(/\.md$/, '');
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] }
      ],
      defaultPath: `${cleanTitle}.pdf`
    });
    
    if (!result.canceled) {
      // Use the corrected CSS instead of the one from renderer
      return await exportToPDF(markdown, result.filePath, { title, styleCSS: correctCSS });
    }
    return { success: false, canceled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-html', async (event, { markdown, title, styleCSS }) => {
  try {
    // OVERRIDE: Get the current theme from saved preferences instead of relying on renderer state
    const currentPrefs = await preferencesManager.load();
    const currentTheme = currentPrefs.previewStyle || 'standard';
    const correctCSS = getThemeCSS(currentTheme);
    console.log('Main process HTML export: Using theme', currentTheme);
    
    // Remove .md extension if present
    const cleanTitle = (title || 'document').replace(/\.md$/, '');
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'HTML Files', extensions: ['html'] }
      ],
      defaultPath: `${cleanTitle}.html`
    });
    
    if (!result.canceled) {
      return await exportToHTML(markdown, result.filePath, { title, styleCSS: correctCSS });
    }
    return { success: false, canceled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-epub', async (event, { markdown, title, author, styleCSS }) => {
  try {
    // OVERRIDE: Get the current theme from saved preferences instead of relying on renderer state
    const currentPrefs = await preferencesManager.load();
    const currentTheme = currentPrefs.previewStyle || 'standard';
    const correctCSS = getThemeCSS(currentTheme);
    console.log('Main process EPUB export: Using theme', currentTheme);
    
    // Remove .md extension if present
    const cleanTitle = (title || 'document').replace(/\.md$/, '');
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'EPUB Files', extensions: ['epub'] }
      ],
      defaultPath: `${cleanTitle}.epub`
    });
    
    if (!result.canceled) {
      return await exportToEPUB(markdown, result.filePath, { title, author, styleCSS: correctCSS });
    }
    return { success: false, canceled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-docx', async (event, { markdown, title, styleCSS }) => {
  try {
    // OVERRIDE: Get the current theme from saved preferences instead of relying on renderer state
    const currentPrefs = await preferencesManager.load();
    const currentTheme = currentPrefs.previewStyle || 'standard';
    const correctCSS = getThemeCSS(currentTheme);
    console.log('Main process DOCX export: Using theme', currentTheme);
    
    // Remove .md extension if present
    const cleanTitle = (title || 'document').replace(/\.md$/, '');
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'Word Documents', extensions: ['docx'] }
      ],
      defaultPath: `${cleanTitle}.docx`
    });
    
    if (!result.canceled) {
      return await exportToDOCX(markdown, result.filePath, { title, styleCSS: correctCSS });
    }
    return { success: false, canceled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Print handler
ipcMain.handle('print-preview', async (event, { html, title, styleCSS }) => {
  try {
    // OVERRIDE: Get the current theme from saved preferences instead of relying on renderer state
    const currentPrefs = await preferencesManager.load();
    const currentTheme = currentPrefs.previewStyle || 'standard';
    const correctCSS = getThemeCSS(currentTheme);
    console.log('Main process Print: Using theme', currentTheme);
    
    // Create a hidden window for printing
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    // Load the HTML content with the provided style
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title || 'Document'}</title>
  <style>
    @media print {
      body {
        margin: 0;
      }
      @page {
        margin: 0.5in;
      }
    }
    ${correctCSS || ''}
  </style>
</head>
<body>
  <div class="preview-content">
    ${html}
  </div>
</body>
</html>`;

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(printContent)}`);

    // Print the window
    printWindow.webContents.print({
      silent: false,
      printBackground: true,
      deviceName: ''
    }, (success, failureReason) => {
      printWindow.close();
      if (!success) {
        console.error('Print failed:', failureReason);
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Print error:', error);
    return { success: false, error: error.message };
  }
});

// Read About.md content
ipcMain.handle('read-about-content', async () => {
  try {
    // When packaged, __dirname points to app.asar/src/main
    // We need to go up to app.asar root and then to public
    const aboutPath = app.isPackaged 
      ? path.join(__dirname, '../../public/About.md')
      : path.join(__dirname, '../../public/About.md');
    
    console.log('Reading About.md from:', aboutPath);
    console.log('App is packaged:', app.isPackaged);
    console.log('__dirname:', __dirname);
    
    const content = await fs.readFile(aboutPath, 'utf-8');
    console.log('Successfully read About.md, length:', content.length);
    return { success: true, content };
  } catch (error) {
    console.error('Failed to read About.md:', error);
    console.error('Attempted path:', aboutPath);
    
    // Try alternative path for packaged app
    if (app.isPackaged) {
      try {
        // Try reading from app.getAppPath()
        const altPath = path.join(app.getAppPath(), 'public', 'About.md');
        console.log('Trying alternative path:', altPath);
        const content = await fs.readFile(altPath, 'utf-8');
        console.log('Successfully read from alternative path');
        return { success: true, content };
      } catch (altError) {
        console.error('Alternative path also failed:', altError);
      }
    }
    
    // Fallback content if file not found
    return { 
      success: true, 
      content: '# About willisMD\n\nVersion 1.0.0\n\nA powerful markdown editor built with Electron and React.\n\nError: Could not load full About content.'
    };
  }
});

// Save confirmation dialog
ipcMain.handle('show-save-confirmation', async (event, { fileName, hasUnsavedChanges }) => {
  if (!hasUnsavedChanges) {
    return { action: 'dont-save' };
  }
  
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Save', "Don't Save", 'Cancel'],
    defaultId: 0,
    cancelId: 2,
    message: `Do you want to save the changes you made to "${fileName}"?`,
    detail: 'Your changes will be lost if you don\'t save them.'
  });
  
  const actions = ['save', 'dont-save', 'cancel'];
  return { action: actions[result.response] };
});

// Generic message box dialog
ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

// File system operations
ipcMain.handle('duplicate-file', async (event, sourcePath, targetPath) => {
  try {
    const fs = require('fs').promises;
    
    // If no target path provided, create one with (copy) suffix
    if (!targetPath) {
      const path = require('path');
      const dir = path.dirname(sourcePath);
      const ext = path.extname(sourcePath);
      const baseName = path.basename(sourcePath, ext);
      
      // Find a unique name
      let copyNum = 1;
      let newPath;
      do {
        const suffix = copyNum === 1 ? ' (copy)' : ` (copy ${copyNum})`;
        newPath = path.join(dir, `${baseName}${suffix}${ext}`);
        copyNum++;
      } while (await fs.access(newPath).then(() => true).catch(() => false));
      
      targetPath = newPath;
    }
    
    await fs.copyFile(sourcePath, targetPath);
    return { success: true, path: targetPath };
  } catch (error) {
    console.error('Failed to duplicate file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-folder', async (event, folderPath) => {
  try {
    const fs = require('fs').promises;
    await fs.mkdir(folderPath, { recursive: true });
    return { success: true };
  } catch (error) {
    console.error('Failed to create folder:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-item', async (event, itemPath) => {
  try {
    const fs = require('fs').promises;
    const stats = await fs.stat(itemPath);
    
    if (stats.isDirectory()) {
      // Use rm with recursive for directories in newer Node.js
      await fs.rm(itemPath, { recursive: true, force: true });
    } else {
      await fs.unlink(itemPath);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to delete item:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rename-item', async (event, oldPath, newPath) => {
  try {
    const fs = require('fs').promises;
    await fs.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    console.error('Failed to rename item:', error);
    return { success: false, error: error.message };
  }
});

// Preferences handlers
ipcMain.handle('preferences-load', async () => {
  try {
    return await preferencesManager.load();
  } catch (error) {
    console.error('Failed to load preferences:', error);
    return preferencesManager.getAll();
  }
});

ipcMain.handle('preferences-save', async (event, preferences) => {
  try {
    return await preferencesManager.setMultiple(preferences);
  } catch (error) {
    console.error('Failed to save preferences:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('preferences-get', async (event, key) => {
  return preferencesManager.get(key);
});

ipcMain.handle('preferences-set', async (event, key, value) => {
  try {
    return await preferencesManager.set(key, value);
  } catch (error) {
    console.error('Failed to set preference:', error);
    return { success: false, error: error.message };
  }
});

// Refresh templates handler
ipcMain.handle('preferences-refresh-templates', async () => {
  try {
    return await preferencesManager.refreshTemplates();
  } catch (error) {
    console.error('Failed to refresh templates:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-folder-dialog', async () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  
  if (!win || win.isDestroyed()) {
    return { success: false, error: 'No active window' };
  }
  
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    buttonLabel: 'Select Folder'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return { success: true, folderPath: result.filePaths[0] };
  }
  return { success: false, canceled: true };
});

ipcMain.handle('get-templates', async () => {
  try {
    return await preferencesManager.getTemplates();
  } catch (error) {
    console.error('Failed to get templates:', error);
    return [];
  }
});

// Recent files and folders handlers
ipcMain.handle('get-recent-files', async () => {
  try {
    return await preferencesManager.getRecentFiles();
  } catch (error) {
    console.error('Failed to get recent files:', error);
    return [];
  }
});

ipcMain.handle('get-recent-folders', async () => {
  try {
    return await preferencesManager.getRecentFolders();
  } catch (error) {
    console.error('Failed to get recent folders:', error);
    return [];
  }
});

ipcMain.handle('add-recent-file', async (event, filePath) => {
  try {
    await preferencesManager.addRecentFile(filePath);
    return { success: true };
  } catch (error) {
    console.error('Failed to add recent file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-recent-folder', async (event, folderPath) => {
  try {
    await preferencesManager.addRecentFolder(folderPath);
    return { success: true };
  } catch (error) {
    console.error('Failed to add recent folder:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-help-content', async () => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Get the path to the Help.md file in the public directory
    let helpPath;
    if (app.isPackaged) {
      // In production, look in the app.asar archive
      helpPath = path.join(process.resourcesPath, 'app.asar', 'public', 'Help.md');
      
      // If not found in asar, try unpacked
      if (!require('fs').existsSync(helpPath)) {
        helpPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'public', 'Help.md');
      }
      
      // If still not found, try relative to the app path
      if (!require('fs').existsSync(helpPath)) {
        helpPath = path.join(app.getAppPath(), 'public', 'Help.md');
      }
    } else {
      // In development, use the public directory
      helpPath = path.join(app.getAppPath(), 'public', 'Help.md');
    }
    
    console.log('Looking for Help.md at:', helpPath);
    
    const content = await fs.readFile(helpPath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    console.error('Failed to read help content:', error);
    return { 
      success: false, 
      error: error.message,
      content: `# Help Not Available\n\nSorry, the help documentation could not be loaded.\n\nError: ${error.message}\n\nPlease visit [GitHub](https://github.com/stacylacy/willisMD) for online documentation.`
    };
  }
});

// Open external link handler
ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('Failed to open external link:', error);
    return { success: false, error: error.message };
  }
});

// App event handlers
app.whenReady().then(async () => {
  console.log('Electron app ready, creating window...');
  
  // Load preferences first
  await preferencesManager.load();
  
  mainWindow = createWindow();
  await createMenu();
});

// Handle app quit with save confirmation
let isQuitting = false;
let forceQuit = false;

app.on('before-quit', async (event) => {
  console.log('App before-quit event');
  
  if (forceQuit) {
    return; // Force quit without checks
  }
  
  if (isQuitting) {
    return; // Already handling quit
  }
  
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  
  event.preventDefault();
  isQuitting = true;
  
  try {
    // Ask renderer if there are unsaved changes
    const unsavedCheck = await new Promise((resolve) => {
      mainWindow.webContents.send('check-unsaved-changes');
      
      const timeout = setTimeout(() => {
        resolve({ hasUnsaved: false });
      }, 1000);
      
      ipcMain.once('unsaved-changes-response', (event, data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });
    
    if (unsavedCheck.hasUnsaved) {
      const confirmation = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        buttons: ['Save All', "Don't Save", 'Cancel'],
        defaultId: 0,
        cancelId: 2,
        message: 'You have unsaved changes in one or more files.',
        detail: 'Do you want to save your changes before quitting?'
      });
      
      if (confirmation.response === 2) {
        // Cancel quit
        isQuitting = false;
        return;
      } else if (confirmation.response === 0) {
        // Save all
        mainWindow.webContents.send('save-all-before-quit');
        
        // Wait for save completion with proper timeout
        const saveTimeout = setTimeout(() => {
          console.log('Save timeout, forcing quit');
          forceQuit = true;
          app.quit();
        }, 10000); // Give more time for saves
        
        ipcMain.once('save-all-complete', () => {
          clearTimeout(saveTimeout);
          console.log('Save complete, quitting app');
          forceQuit = true;
          app.quit();
        });
        
        return;
      }
    }
    
    // No unsaved changes or user chose don't save
    console.log('No unsaved changes, quitting app');
    forceQuit = true;
    app.quit();
    
  } catch (error) {
    console.error('Error checking unsaved changes:', error);
    // Show error dialog and allow quit
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Error',
      message: 'An error occurred while checking for unsaved changes. Your work may not be saved.',
      buttons: ['Quit Anyway', 'Cancel']
    });
    
    if (result.response === 0) {
      forceQuit = true;
      app.quit();
    } else {
      isQuitting = false;
    }
  }
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow();
  }
});

// Handle file opening on macOS (when file is double-clicked)
app.on('open-file', async (event, filePath) => {
  event.preventDefault();
  console.log('App open-file event:', filePath);
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Window exists, send file path to renderer
    mainWindow.webContents.send('menu-open-file', filePath);
    // Add to recent files
    await preferencesManager.addRecentFile(filePath);
    await createMenu(); // Rebuild menu to show updated recent files
  } else {
    // Store file path to open when window is ready
    fileToOpen = filePath;
    
    // Create window if app is already ready
    if (app.isReady()) {
      mainWindow = createWindow();
    }
  }
});

// Handle file opening from command line arguments (Windows/Linux)
// Check if a file was passed as argument when starting the app
if (process.platform !== 'darwin') { // macOS uses open-file event instead
  // In development, electron path is argv[0], app is argv[1], and file might be argv[2]
  // In production, app is argv[0] and file might be argv[1]
  let possibleFilePaths = [];
  
  if (app.isPackaged) {
    // In packaged app, file path is likely argv[1]
    if (process.argv.length >= 2) {
      possibleFilePaths.push(process.argv[1]);
    }
  } else {
    // In development, file path is likely argv[2] or later
    if (process.argv.length >= 3) {
      possibleFilePaths = process.argv.slice(2);
    }
  }
  
  // Check each argument to see if it's a markdown file
  for (const arg of possibleFilePaths) {
    if (arg && (arg.endsWith('.md') || arg.endsWith('.markdown')) && require('fs').existsSync(arg)) {
      console.log('File argument detected:', arg);
      fileToOpen = arg;
      break;
    }
  }
}

console.log('Electron main process started');