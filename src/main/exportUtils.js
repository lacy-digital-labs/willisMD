const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer');
const officegen = require('officegen');
const EPub = require('epub-gen');
const { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, HeadingLevel, AlignmentType, WidthType, BorderStyle } = require('docx');

// Export to PDF using Puppeteer
async function exportToPDF(markdown, outputPath, options = {}) {
  try {
    console.log('Starting PDF export...');
    
    // Convert markdown to HTML
    const html = marked(markdown);
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Exported Document</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 { 
            margin-top: 2rem; 
            margin-bottom: 1rem; 
            color: #222;
        }
        h1 { border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
        h2 { border-bottom: 1px solid #eee; padding-bottom: 0.3rem; }
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 1rem 0;
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 0.5rem; 
            text-align: left; 
        }
        th { background-color: #f5f5f5; font-weight: bold; }
        code { 
            background-color: #f5f5f5; 
            padding: 0.2rem 0.4rem; 
            border-radius: 3px; 
            font-family: monospace;
        }
        pre { 
            background-color: #f5f5f5; 
            padding: 1rem; 
            border-radius: 5px; 
            overflow-x: auto;
        }
        blockquote {
            border-left: 4px solid #ddd;
            margin: 0;
            padding-left: 1rem;
            color: #666;
        }
        img { max-width: 100%; height: auto; }
        @media print {
            body { margin: 0; padding: 1rem; }
        }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;

    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    
    const pdfOptions = {
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      },
      ...options
    };
    
    await page.pdf(pdfOptions);
    await browser.close();
    
    console.log('PDF export completed:', outputPath);
    return { success: true, path: outputPath };
    
  } catch (error) {
    console.error('PDF export failed:', error);
    return { success: false, error: error.message };
  }
}

// Export to HTML
async function exportToHTML(markdown, outputPath, options = {}) {
  try {
    console.log('Starting HTML export...');
    
    const html = marked(markdown);
    const title = options.title || 'Exported Document';
    
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
            background-color: #fff;
        }
        h1, h2, h3, h4, h5, h6 { 
            margin-top: 2rem; 
            margin-bottom: 1rem; 
            color: #222;
        }
        h1 { 
            border-bottom: 2px solid #eee; 
            padding-bottom: 0.5rem; 
            font-size: 2.2rem;
        }
        h2 { 
            border-bottom: 1px solid #eee; 
            padding-bottom: 0.3rem; 
            font-size: 1.8rem;
        }
        h3 { font-size: 1.5rem; }
        h4 { font-size: 1.3rem; }
        h5 { font-size: 1.1rem; }
        h6 { font-size: 1rem; }
        
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 1rem 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 0.75rem; 
            text-align: left; 
        }
        th { 
            background-color: #f8f9fa; 
            font-weight: 600;
            color: #495057;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        code { 
            background-color: #f8f9fa; 
            padding: 0.2rem 0.4rem; 
            border-radius: 3px; 
            font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 0.9em;
            color: #d63384;
        }
        pre { 
            background-color: #f8f9fa; 
            padding: 1rem; 
            border-radius: 5px; 
            overflow-x: auto;
            border: 1px solid #e9ecef;
        }
        pre code {
            background: none;
            padding: 0;
            color: #333;
        }
        
        blockquote {
            border-left: 4px solid #007bff;
            margin: 1rem 0;
            padding: 0.5rem 1rem;
            background-color: #f8f9fa;
            color: #495057;
        }
        
        a {
            color: #007bff;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        
        img { 
            max-width: 100%; 
            height: auto; 
            border-radius: 5px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        ul, ol {
            padding-left: 2rem;
        }
        li {
            margin-bottom: 0.5rem;
        }
        
        hr {
            border: none;
            border-top: 2px solid #eee;
            margin: 2rem 0;
        }
        
        .export-meta {
            font-size: 0.9rem;
            color: #6c757d;
            border-top: 1px solid #eee;
            padding-top: 1rem;
            margin-top: 2rem;
        }
    </style>
</head>
<body>
    ${html}
    <div class="export-meta">
        <p>Exported from willisMD on ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>`;

    await fs.writeFile(outputPath, fullHtml, 'utf-8');
    
    console.log('HTML export completed:', outputPath);
    return { success: true, path: outputPath };
    
  } catch (error) {
    console.error('HTML export failed:', error);
    return { success: false, error: error.message };
  }
}

// Export to EPUB
async function exportToEPUB(markdown, outputPath, options = {}) {
  try {
    console.log('Starting EPUB export...');
    
    const html = marked(markdown);
    const title = options.title || 'Exported Document';
    const author = options.author || 'willisMD User';
    
    const epubOptions = {
      title: title,
      author: author,
      publisher: 'willisMD',
      description: options.description || 'Document exported from willisMD',
      content: [
        {
          title: title,
          data: html
        }
      ],
      output: outputPath,
      verbose: false,
      tocTitle: 'Table of Contents',
      css: `
        body {
          font-family: Georgia, serif;
          line-height: 1.6;
          color: #333;
        }
        h1, h2, h3, h4, h5, h6 { 
          margin-top: 1.5em; 
          margin-bottom: 0.5em; 
          color: #222;
        }
        table { 
          border-collapse: collapse; 
          width: 100%; 
          margin: 1em 0;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 0.5em; 
          text-align: left; 
        }
        th { background-color: #f5f5f5; }
        code { 
          background-color: #f5f5f5; 
          padding: 0.2em 0.4em; 
          font-family: monospace;
        }
        pre { 
          background-color: #f5f5f5; 
          padding: 1em; 
          overflow-x: auto;
        }
        blockquote {
          border-left: 3px solid #ddd;
          margin-left: 0;
          padding-left: 1em;
          color: #666;
        }
      `
    };
    
    const epub = new EPub(epubOptions);
    await epub.promise;
    
    console.log('EPUB export completed:', outputPath);
    return { success: true, path: outputPath };
    
  } catch (error) {
    console.error('EPUB export failed:', error);
    return { success: false, error: error.message };
  }
}

// Export to DOCX
async function exportToDOCX(markdown, outputPath, options = {}) {
  try {
    console.log('Starting DOCX export...');
    
    const title = options.title || 'Exported Document';
    
    // Convert markdown to HTML first, then to simple text with basic formatting
    const html = marked(markdown);
    
    // Simple but reliable conversion
    const docElements = [];
    
    // Add a title
    docElements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 28
          })
        ],
        spacing: { after: 400 }
      })
    );
    
    // Parse markdown line by line for basic structure
    const lines = markdown.split('\n');
    let inTable = false;
    let tableRows = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed) {
        continue;
      }
      
      // Handle tables
      if (trimmed.includes('|') && trimmed.length > 1) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        
        const cells = trimmed.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
        
        // Skip separator rows (---|---|---)
        if (!cells.every(cell => cell.match(/^:?-+:?$/))) {
          tableRows.push(cells);
        }
        continue;
      } else if (inTable) {
        // End of table - create it
        if (tableRows.length > 0) {
          docElements.push(createSimpleTable(tableRows));
        }
        tableRows = [];
        inTable = false;
      }
      
      // Handle headings
      if (trimmed.startsWith('#')) {
        const level = (trimmed.match(/^#+/) || [''])[0].length;
        const text = trimmed.substring(level).trim();
        
        const fontSize = Math.max(16, 24 - level * 2);
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: text,
                bold: true,
                size: fontSize
              })
            ],
            spacing: { before: 200, after: 200 }
          })
        );
        continue;
      }
      
      // Handle code blocks
      if (trimmed.startsWith('```')) {
        continue; // Skip for now
      }
      
      // Handle lists
      if (trimmed.match(/^(\d+\.|\*|\+|-)\s+/)) {
        const text = trimmed.replace(/^(\d+\.|\*|\+|-)\s+/, '');
        docElements.push(
          new Paragraph({
            children: [
              new TextRun('• ' + text)
            ],
            indent: { left: 720 },
            spacing: { after: 120 }
          })
        );
        continue;
      }
      
      // Handle quotes
      if (trimmed.startsWith('>')) {
        const text = trimmed.substring(1).trim();
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: text,
                italics: true
              })
            ],
            indent: { left: 720 },
            spacing: { after: 120 }
          })
        );
        continue;
      }
      
      // Regular paragraphs
      docElements.push(
        new Paragraph({
          children: [new TextRun(trimmed)],
          spacing: { after: 120 }
        })
      );
    }
    
    // Handle any remaining table
    if (inTable && tableRows.length > 0) {
      docElements.push(createSimpleTable(tableRows));
    }
    
    // Create the document with minimal configuration
    const doc = new Document({
      sections: [{
        children: docElements
      }]
    });
    
    // Generate and save the document
    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(outputPath, buffer);
    
    console.log('DOCX export completed:', outputPath);
    return { success: true, path: outputPath };
    
  } catch (error) {
    console.error('DOCX export failed:', error);
    return { success: false, error: error.message };
  }
}

// Create a simple table that definitely works
function createSimpleTable(rows) {
  try {
    const tableRows = rows.map((row, rowIndex) => {
      const cells = row.map(cellText => 
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun(cellText || '')]
            })
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
          }
        })
      );
      
      return new TableRow({
        children: cells
      });
    });
    
    return new Table({
      rows: tableRows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
      }
    });
  } catch (error) {
    console.error('Table creation failed:', error);
    // Return a simple paragraph as fallback
    return new Paragraph({
      children: [new TextRun(`[Table with ${rows.length} rows]`)],
      spacing: { after: 200 }
    });
  }
}


module.exports = {
  exportToPDF,
  exportToHTML,
  exportToEPUB,
  exportToDOCX
};