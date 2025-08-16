const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer');
const officegen = require('officegen');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');
const { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, HeadingLevel, AlignmentType, WidthType, BorderStyle } = require('docx');

// Optimize CSS for better PDF rendering
function optimizeCSSForPDF(css) {
  return css
    // Replace webkit-specific gradient text with solid color
    .replace(/background:\s*linear-gradient\([^}]+\);\s*-webkit-background-clip:\s*text;\s*-webkit-text-fill-color:\s*transparent;/g, 
             'color: #667eea;')
    
    // Replace complex gradients with solid colors  
    .replace(/background:\s*linear-gradient\([^;]+\);/g, 'background: #f0f4ff;')
    
    // Simplify box-shadows for PDF
    .replace(/box-shadow:[^;]+;/g, 'border: 1px solid #e0e0e0;')
    
    // Convert rgba colors to rgb for better PDF support
    .replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/g, 'rgb($1,$2,$3)')
    
    // Remove webkit-specific properties
    .replace(/-webkit-[^:]+:[^;]+;/g, '')
    
    // Remove transform properties that can cause issues
    .replace(/transform:[^;]+;/g, '')
    
    // Ensure print-safe fonts
    .replace(/font-family:\s*'Inter'[^;]+;/g, "font-family: 'Helvetica Neue', Arial, sans-serif;")
    .replace(/font-family:\s*'Comic Sans MS'[^;]+;/g, "font-family: 'Arial', sans-serif;")
    
    // Remove complex background patterns
    .replace(/background-image:[^;]+;/g, '')
    
    // Simplify border-radius for better PDF rendering
    .replace(/border-radius:\s*([0-9]+)px/g, (match, p1) => {
      const radius = parseInt(p1);
      return radius > 10 ? 'border-radius: 10px' : match;
    });
}

// Export to PDF using Puppeteer
async function exportToPDF(markdown, outputPath, options = {}) {
  try {
    console.log('Starting PDF export...');
    
    // Convert markdown to HTML
    const html = marked(markdown);
    
    // Use provided styleCSS but optimize for PDF rendering
    let styleCSS = options.styleCSS || `
        .preview-content {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        .preview-content h1, .preview-content h2, .preview-content h3, 
        .preview-content h4, .preview-content h5, .preview-content h6 { 
            margin-top: 2rem; 
            margin-bottom: 1rem; 
            color: #222;
        }
        .preview-content h1 { border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
        .preview-content h2 { border-bottom: 1px solid #eee; padding-bottom: 0.3rem; }
        .preview-content table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 1rem 0;
        }
        .preview-content th, .preview-content td { 
            border: 1px solid #ddd; 
            padding: 0.5rem; 
            text-align: left; 
        }
        .preview-content th { background-color: #f5f5f5; font-weight: bold; }
        .preview-content code { 
            background-color: #f5f5f5; 
            padding: 0.2rem 0.4rem; 
            border-radius: 3px; 
            font-family: monospace;
        }
        .preview-content pre { 
            background-color: #f5f5f5; 
            padding: 1rem; 
            border-radius: 5px; 
            overflow-x: auto;
        }
        .preview-content blockquote {
            border-left: 4px solid #ddd;
            margin: 0;
            padding-left: 1rem;
            color: #666;
        }
        .preview-content img { max-width: 100%; height: auto; }`;

    // Optimize CSS for PDF rendering if we received custom CSS
    if (options.styleCSS) {
      styleCSS = optimizeCSSForPDF(styleCSS);
      console.log('CSS optimized for PDF rendering');
    }
    
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${options.title || 'Exported Document'}</title>
    <style>
        @media print {
            body { margin: 0; }
            @page { margin: 0.5in; }
        }
        ${styleCSS}
    </style>
</head>
<body>
    <div class="preview-content">
        ${html}
    </div>
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
    
    // Use provided styleCSS or fallback to default
    const styleCSS = options.styleCSS || `
        .preview-content {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
            background-color: #fff;
        }
        .preview-content h1, .preview-content h2, .preview-content h3, 
        .preview-content h4, .preview-content h5, .preview-content h6 { 
            margin-top: 2rem; 
            margin-bottom: 1rem; 
            color: #222;
        }
        .preview-content h1 { 
            border-bottom: 2px solid #eee; 
            padding-bottom: 0.5rem; 
            font-size: 2.2rem;
        }
        .preview-content h2 { 
            border-bottom: 1px solid #eee; 
            padding-bottom: 0.3rem; 
            font-size: 1.8rem;
        }
        .preview-content h3 { font-size: 1.5rem; }
        .preview-content h4 { font-size: 1.3rem; }
        .preview-content h5 { font-size: 1.1rem; }
        .preview-content h6 { font-size: 1rem; }
        
        .preview-content table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 1rem 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .preview-content th, .preview-content td { 
            border: 1px solid #ddd; 
            padding: 0.75rem; 
            text-align: left; 
        }
        .preview-content th { 
            background-color: #f8f9fa; 
            font-weight: 600;
            color: #495057;
        }
        .preview-content tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .preview-content code { 
            background-color: #f8f9fa; 
            padding: 0.2rem 0.4rem; 
            border-radius: 3px; 
            font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 0.9em;
            color: #d63384;
        }
        .preview-content pre { 
            background-color: #f8f9fa; 
            padding: 1rem; 
            border-radius: 5px; 
            overflow-x: auto;
            border: 1px solid #e9ecef;
        }
        .preview-content pre code {
            background: none;
            padding: 0;
            color: #333;
        }
        
        .preview-content blockquote {
            border-left: 4px solid #007bff;
            margin: 1rem 0;
            padding: 0.5rem 1rem;
            background-color: #f8f9fa;
            color: #495057;
        }
        
        .preview-content a {
            color: #007bff;
            text-decoration: none;
        }
        .preview-content a:hover {
            text-decoration: underline;
        }
        
        .preview-content img { 
            max-width: 100%; 
            height: auto; 
            border-radius: 5px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .preview-content ul, .preview-content ol {
            padding-left: 2rem;
        }
        .preview-content li {
            margin-bottom: 0.5rem;
        }
        
        .preview-content hr {
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
        }`;
    
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        ${styleCSS}
        
        /* Additional export metadata styling */
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
    <div class="preview-content">
        ${html}
        <div class="export-meta">
            <p>Exported from willisMD on ${new Date().toLocaleString()}</p>
        </div>
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

// Export to EPUB - Custom secure implementation
async function exportToEPUB(markdown, outputPath, options = {}) {
  try {
    console.log('Starting EPUB export with secure implementation...');
    
    const html = marked(markdown);
    const title = options.title || 'Exported Document';
    const author = options.author || 'willisMD User';
    const bookId = uuidv4();
    const date = new Date().toISOString();
    
    // Create a write stream for the output file
    const output = require('fs').createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Handle archive errors
    archive.on('error', (err) => {
      throw err;
    });
    
    // Pipe archive data to the file
    archive.pipe(output);
    
    // Add mimetype file (must be first and uncompressed)
    archive.append('application/epub+zip', { 
      name: 'mimetype',
      store: true // No compression for mimetype
    });
    
    // Create META-INF/container.xml
    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    archive.append(containerXml, { name: 'META-INF/container.xml' });
    
    // Create OEBPS/content.opf (metadata and manifest)
    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:identifier id="BookID">urn:uuid:${bookId}</dc:identifier>
    <dc:language>en</dc:language>
    <dc:publisher>willisMD</dc:publisher>
    <dc:date>${date}</dc:date>
    <meta property="dcterms:modified">${date}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="style" href="style.css" media-type="text/css"/>
  </manifest>
  <spine>
    <itemref idref="chapter1"/>
  </spine>
</package>`;
    archive.append(contentOpf, { name: 'OEBPS/content.opf' });
    
    // Create OEBPS/nav.xhtml (navigation document)
    const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Navigation</title>
  <meta charset="utf-8"/>
</head>
<body>
  <nav epub:type="toc">
    <h1>Table of Contents</h1>
    <ol>
      <li><a href="chapter1.xhtml">${escapeXml(title)}</a></li>
    </ol>
  </nav>
</body>
</html>`;
    archive.append(navXhtml, { name: 'OEBPS/nav.xhtml' });
    
    // Create OEBPS/chapter1.xhtml (main content)
    const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(title)}</title>
  <meta charset="utf-8"/>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>${escapeXml(title)}</h1>
  ${html}
</body>
</html>`;
    archive.append(chapterXhtml, { name: 'OEBPS/chapter1.xhtml' });
    
    // Create OEBPS/style.css - Use provided styleCSS or fallback to default
    // Convert the provided styles to work with EPUB (remove .preview-content wrapper if present)
    let styleCss = options.styleCSS || `
.preview-content {
  font-family: Georgia, 'Times New Roman', serif;
  line-height: 1.6;
  margin: 1em;
  color: #333;
}

.preview-content h1, .preview-content h2, .preview-content h3, 
.preview-content h4, .preview-content h5, .preview-content h6 {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  color: #222;
}

.preview-content h1 { font-size: 1.8em; }
.preview-content h2 { font-size: 1.5em; }
.preview-content h3 { font-size: 1.3em; }
.preview-content h4 { font-size: 1.1em; }
.preview-content h5 { font-size: 1em; }
.preview-content h6 { font-size: 0.9em; }

.preview-content p {
  margin: 1em 0;
  text-align: justify;
}

.preview-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.preview-content th, .preview-content td {
  border: 1px solid #ddd;
  padding: 0.5em;
  text-align: left;
}

.preview-content th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.preview-content code {
  background-color: #f5f5f5;
  padding: 0.2em 0.4em;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.preview-content pre {
  background-color: #f5f5f5;
  padding: 1em;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.preview-content blockquote {
  border-left: 3px solid #ddd;
  margin: 1em 0;
  padding-left: 1em;
  color: #666;
  font-style: italic;
}

.preview-content a {
  color: #0066cc;
  text-decoration: none;
}

.preview-content a:hover {
  text-decoration: underline;
}

.preview-content img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}

.preview-content ul, .preview-content ol {
  margin: 1em 0;
  padding-left: 2em;
}

.preview-content li {
  margin: 0.5em 0;
}
`;
    
    // Convert .preview-content selectors to body/root selectors for EPUB
    styleCss = styleCss.replace(/\.preview-content\s*/g, '');
    archive.append(styleCss, { name: 'OEBPS/style.css' });
    
    // Finalize the archive
    await archive.finalize();
    
    // Wait for the output stream to finish
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      output.on('error', reject);
    });
    
    console.log('EPUB export completed:', outputPath);
    return { success: true, path: outputPath };
    
  } catch (error) {
    console.error('EPUB export failed:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to escape XML special characters
function escapeXml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Export to DOCX
async function exportToDOCX(markdown, outputPath, options = {}) {
  try {
    console.log('Starting DOCX export...');
    
    const title = options.title || 'Exported Document';
    
    // Extract some basic styling preferences from styleCSS if provided
    const styleCSS = options.styleCSS || '';
    let fontFamily = 'Times New Roman';
    let headingColor = '#000000';
    
    // Try to extract font-family from the CSS (basic parsing)
    const fontFamilyMatch = styleCSS.match(/font-family:\s*([^;]+)/i);
    if (fontFamilyMatch) {
      const fontValue = fontFamilyMatch[1].trim().replace(/['"]/g, '');
      // Use the first font in the font stack
      fontFamily = fontValue.split(',')[0].trim() || 'Times New Roman';
      // Handle system fonts
      if (fontFamily.includes('system') || fontFamily === '-apple-system') {
        fontFamily = 'Calibri';
      } else if (fontFamily === 'Georgia') {
        fontFamily = 'Georgia';
      } else if (fontFamily.includes('Arial') || fontFamily.includes('Helvetica')) {
        fontFamily = 'Arial';
      }
    }
    
    // Try to extract heading color
    const headingColorMatch = styleCSS.match(/h1[^}]*color:\s*([^;]+)/i);
    if (headingColorMatch) {
      const colorValue = headingColorMatch[1].trim();
      if (colorValue.startsWith('#')) {
        headingColor = colorValue.toUpperCase().replace('#', '');
      }
    }
    
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
            size: 28,
            font: fontFamily,
            color: headingColor
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
                size: fontSize,
                font: fontFamily,
                color: headingColor
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
              new TextRun({
                text: '• ' + text,
                font: fontFamily
              })
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
                italics: true,
                font: fontFamily
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
          children: [new TextRun({
            text: trimmed,
            font: fontFamily
          })],
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