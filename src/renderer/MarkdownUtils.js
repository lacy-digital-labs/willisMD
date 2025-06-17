// Markdown formatting utilities for text manipulation

console.log('MarkdownUtils module loaded');

export function getTextSelection(textarea) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const beforeText = textarea.value.substring(0, start);
  const afterText = textarea.value.substring(end);
  
  return {
    start,
    end,
    selectedText,
    beforeText,
    afterText,
    hasSelection: start !== end
  };
}

export function replaceSelection(textarea, newText, cursorOffset = 0) {
  const { start, end, beforeText, afterText } = getTextSelection(textarea);
  const newContent = beforeText + newText + afterText;
  const newCursorPos = start + newText.length + cursorOffset;
  
  return {
    content: newContent,
    cursorPos: newCursorPos
  };
}

export function wrapSelection(textarea, prefix, suffix = '') {
  const { selectedText, hasSelection } = getTextSelection(textarea);
  
  if (hasSelection) {
    return replaceSelection(textarea, prefix + selectedText + suffix, -suffix.length);
  } else {
    // No selection, insert formatting and place cursor inside
    const placeholder = suffix ? 'text' : '';
    return replaceSelection(textarea, prefix + placeholder + suffix, -suffix.length - placeholder.length);
  }
}

export function toggleLineFormatting(textarea, prefix) {
  const { start, beforeText, afterText } = getTextSelection(textarea);
  const lines = beforeText.split('\n');
  const currentLineIndex = lines.length - 1;
  const currentLine = lines[currentLineIndex];
  
  let newLine;
  let cursorOffset = 0;
  
  if (currentLine.startsWith(prefix)) {
    // Remove formatting
    newLine = currentLine.substring(prefix.length);
    cursorOffset = -prefix.length;
  } else {
    // Add formatting
    newLine = prefix + currentLine;
    cursorOffset = prefix.length;
  }
  
  lines[currentLineIndex] = newLine;
  const newBeforeText = lines.join('\n');
  const newContent = newBeforeText + afterText;
  const newCursorPos = start + cursorOffset;
  
  return {
    content: newContent,
    cursorPos: newCursorPos
  };
}

export function insertAtCursor(textarea, text) {
  return replaceSelection(textarea, text, 0);
}

// Specific formatting functions
export const formatBold = (textarea) => {
  console.log('formatBold called');
  return wrapSelection(textarea, '**', '**');
};
export const formatItalic = (textarea) => wrapSelection(textarea, '*', '*');
export const formatStrikethrough = (textarea) => wrapSelection(textarea, '~~', '~~');
export const formatCode = (textarea) => wrapSelection(textarea, '`', '`');
export const formatCodeBlock = (textarea) => wrapSelection(textarea, '```\n', '\n```');

export const formatH1 = (textarea) => toggleLineFormatting(textarea, '# ');
export const formatH2 = (textarea) => toggleLineFormatting(textarea, '## ');
export const formatH3 = (textarea) => toggleLineFormatting(textarea, '### ');

export const formatUnorderedList = (textarea) => toggleLineFormatting(textarea, '- ');
export const formatOrderedList = (textarea) => toggleLineFormatting(textarea, '1. ');

export const formatQuote = (textarea) => toggleLineFormatting(textarea, '> ');

export const formatLink = (textarea) => {
  const { selectedText, hasSelection } = getTextSelection(textarea);
  if (hasSelection) {
    return replaceSelection(textarea, `[${selectedText}](url)`, -4);
  } else {
    return replaceSelection(textarea, '[text](url)', -9);
  }
};

export const formatImage = (textarea) => {
  const { selectedText, hasSelection } = getTextSelection(textarea);
  if (hasSelection) {
    return replaceSelection(textarea, `![${selectedText}](url)`, -4);
  } else {
    return replaceSelection(textarea, '![alt text](url)', -13);
  }
};

export const formatTable = (textarea) => {
  const tableText = `| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`;
  return insertAtCursor(textarea, tableText);
};

export const formatHorizontalRule = (textarea) => {
  return insertAtCursor(textarea, '\n---\n');
};

// Advanced Table utilities
export function parseTableAtCursor(textarea) {
  const { start, beforeText, afterText } = getTextSelection(textarea);
  const allText = beforeText + afterText;
  const allLines = allText.split('\n');
  const cursorLineIndex = beforeText.split('\n').length - 1;
  
  // Find table boundaries by looking both directions from cursor
  let tableStartIndex = cursorLineIndex;
  let tableEndIndex = cursorLineIndex;
  
  // Look backward to find start of table
  while (tableStartIndex > 0) {
    const line = allLines[tableStartIndex - 1].trim();
    if (!isTableRow(line)) break;
    tableStartIndex--;
  }
  
  // Look forward to find end of table
  while (tableEndIndex < allLines.length - 1) {
    const line = allLines[tableEndIndex + 1].trim();
    if (!isTableRow(line)) break;
    tableEndIndex++;
  }
  
  // Check if cursor is actually in a table
  if (!isTableRow(allLines[cursorLineIndex].trim())) {
    return null;
  }
  
  // Collect all table lines
  const tableLines = allLines.slice(tableStartIndex, tableEndIndex + 1);
  
  // Parse table structure
  if (tableLines.length < 2) return null;
  
  const headerRow = parseRowCells(tableLines[0]);
  const separatorRow = tableLines[1];
  const dataRows = tableLines.slice(2).map(parseRowCells);
  
  // Parse alignment from separator row
  const alignments = parseSeparatorRow(separatorRow);
  
  // Calculate cursor position within table
  const currentRowInTable = cursorLineIndex - tableStartIndex;
  
  // Find current column by analyzing cursor position within the line
  const currentLine = allLines[cursorLineIndex];
  const textBeforeCursor = beforeText.split('\n').pop();
  const currentColumn = findColumnAtPosition(currentLine, textBeforeCursor.length);
  
  console.log('Table parsing:', {
    cursorLineIndex,
    tableStartIndex, 
    tableEndIndex,
    currentRowInTable,
    currentColumn,
    currentLine: currentLine.substring(0, 50)
  });
  
  return {
    headerRow,
    dataRows,
    alignments,
    tableStartLine: tableStartIndex,
    tableEndLine: tableEndIndex,
    totalLines: tableLines.length,
    currentRow: currentRowInTable,
    currentColumn,
    allLines,
    cursorLineIndex
  };
}

function findColumnAtPosition(line, cursorPos) {
  let column = 0;
  let pos = 0;
  
  for (let i = 0; i <= cursorPos && i < line.length; i++) {
    if (line[i] === '|') {
      column++;
    }
  }
  
  // Adjust for leading | (column 0 is before first |, column 1 is between first and second |, etc.)
  return Math.max(0, column - 1);
}

function isTableRow(line) {
  return line.includes('|') && line.trim().length > 0;
}

function parseRowCells(line) {
  return line.split('|').map(cell => cell.trim()).filter((cell, index, arr) => {
    // Remove empty cells at start/end that come from leading/trailing |
    return !(index === 0 && cell === '') && !(index === arr.length - 1 && cell === '');
  });
}

function parseSeparatorRow(line) {
  const cells = parseRowCells(line);
  return cells.map(cell => {
    if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
    if (cell.endsWith(':')) return 'right';
    return 'left';
  });
}

function buildTableRow(cells, alignments = []) {
  const paddedCells = cells.map((cell, index) => {
    const minWidth = Math.max(cell.length, 8);
    const alignment = alignments[index] || 'left';
    
    if (alignment === 'center') {
      const totalPadding = minWidth - cell.length;
      const leftPad = Math.floor(totalPadding / 2);
      const rightPad = totalPadding - leftPad;
      return ' '.repeat(leftPad) + cell + ' '.repeat(rightPad);
    } else if (alignment === 'right') {
      return cell.padStart(minWidth);
    } else {
      return cell.padEnd(minWidth);
    }
  });
  
  return '| ' + paddedCells.join(' | ') + ' |';
}

function buildSeparatorRow(columnCount, alignments = []) {
  const separators = Array(columnCount).fill(0).map((_, index) => {
    const alignment = alignments[index] || 'left';
    const base = '--------';
    
    if (alignment === 'center') return ':' + base + ':';
    if (alignment === 'right') return base + ':';
    return base;
  });
  
  return '| ' + separators.join(' | ') + ' |';
}

export const insertTable = (textarea, rows = 3, cols = 3) => {
  const headers = Array(cols).fill(0).map((_, i) => `Header ${i + 1}`);
  const headerRow = buildTableRow(headers);
  const separatorRow = buildSeparatorRow(cols);
  
  const dataRows = Array(rows - 1).fill(0).map((_, rowIndex) => {
    const cells = Array(cols).fill(0).map((_, colIndex) => `Cell ${rowIndex + 1},${colIndex + 1}`);
    return buildTableRow(cells);
  });
  
  const tableText = [headerRow, separatorRow, ...dataRows].join('\n');
  return insertAtCursor(textarea, '\n' + tableText + '\n');
};

export const addTableRow = (textarea, position = 'after') => {
  const table = parseTableAtCursor(textarea);
  if (!table) {
    console.log('No table found at cursor');
    return null;
  }
  
  const { headerRow, dataRows, alignments, currentRow } = table;
  const columnCount = headerRow.length;
  
  console.log('Adding row:', { position, currentRow, dataRowsLength: dataRows.length });
  
  // Create new empty row
  const newCells = Array(columnCount).fill('');
  
  // Calculate insertion position
  let targetRowIndex;
  if (currentRow <= 1) {
    // Cursor is on header or separator - add to beginning of data rows
    targetRowIndex = 0;
  } else {
    // Cursor is on data row
    const dataRowIndex = currentRow - 2; // Subtract header and separator
    if (position === 'before') {
      targetRowIndex = dataRowIndex;
    } else {
      targetRowIndex = dataRowIndex + 1;
    }
  }
  
  console.log('Inserting at data row index:', targetRowIndex);
  
  // Insert the new row
  const newDataRows = [...dataRows];
  newDataRows.splice(targetRowIndex, 0, newCells);
  
  // Rebuild table
  const headerRowText = buildTableRow(headerRow, alignments);
  const separatorRow = buildSeparatorRow(columnCount, alignments);
  const dataRowsText = newDataRows.map(row => buildTableRow(row, alignments));
  
  const newTableText = [headerRowText, separatorRow, ...dataRowsText].join('\n');
  
  return replaceTableInText(textarea, table, newTableText);
};

export const deleteTableRow = (textarea) => {
  const table = parseTableAtCursor(textarea);
  if (!table || table.dataRows.length <= 1) return null;
  
  const { headerRow, dataRows, alignments, currentRow } = table;
  
  // Don't delete if we're on header or separator row
  if (currentRow <= 1) return null;
  
  const rowToDelete = currentRow - 2; // Adjust for header and separator
  const newDataRows = dataRows.filter((_, index) => index !== rowToDelete);
  
  // Rebuild table
  const headerRowText = buildTableRow(headerRow, alignments);
  const separatorRow = buildSeparatorRow(headerRow.length, alignments);
  const dataRowsText = newDataRows.map(row => buildTableRow(row, alignments));
  
  const newTableText = [headerRowText, separatorRow, ...dataRowsText].join('\n');
  
  return replaceTableInText(textarea, table, newTableText);
};

export const addTableColumn = (textarea, position = 'after') => {
  const table = parseTableAtCursor(textarea);
  if (!table) {
    console.log('No table found at cursor');
    return null;
  }
  
  const { headerRow, dataRows, alignments, currentColumn } = table;
  
  console.log('Adding column:', { position, currentColumn, headerLength: headerRow.length });
  
  // Calculate insertion position
  let insertIndex;
  if (position === 'before') {
    insertIndex = currentColumn;
  } else {
    insertIndex = currentColumn + 1;
  }
  
  // Ensure insertIndex is within bounds
  insertIndex = Math.max(0, Math.min(insertIndex, headerRow.length));
  
  console.log('Inserting column at index:', insertIndex);
  
  // Add to header
  const newHeaderRow = [...headerRow];
  newHeaderRow.splice(insertIndex, 0, 'New Header');
  
  // Add to data rows
  const newDataRows = dataRows.map(row => {
    const newRow = [...row];
    // Ensure row has same length as header before insertion
    while (newRow.length < headerRow.length) {
      newRow.push('');
    }
    newRow.splice(insertIndex, 0, '');
    return newRow;
  });
  
  // Add alignment
  const newAlignments = [...alignments];
  while (newAlignments.length < headerRow.length) {
    newAlignments.push('left');
  }
  newAlignments.splice(insertIndex, 0, 'left');
  
  // Rebuild table
  const headerRowText = buildTableRow(newHeaderRow, newAlignments);
  const separatorRow = buildSeparatorRow(newHeaderRow.length, newAlignments);
  const dataRowsText = newDataRows.map(row => buildTableRow(row, newAlignments));
  
  const newTableText = [headerRowText, separatorRow, ...dataRowsText].join('\n');
  
  return replaceTableInText(textarea, table, newTableText);
};

export const deleteTableColumn = (textarea) => {
  const table = parseTableAtCursor(textarea);
  if (!table || table.headerRow.length <= 1) {
    console.log('Cannot delete column: no table or only one column');
    return null;
  }
  
  const { headerRow, dataRows, alignments, currentColumn } = table;
  
  console.log('Deleting column:', { currentColumn, headerLength: headerRow.length });
  
  // Remove from header
  const newHeaderRow = headerRow.filter((_, index) => index !== currentColumn);
  
  // Remove from data rows
  const newDataRows = dataRows.map(row => row.filter((_, index) => index !== currentColumn));
  
  // Remove alignment
  const newAlignments = alignments.filter((_, index) => index !== currentColumn);
  
  // Rebuild table
  const headerRowText = buildTableRow(newHeaderRow, newAlignments);
  const separatorRow = buildSeparatorRow(newHeaderRow.length, newAlignments);
  const dataRowsText = newDataRows.map(row => buildTableRow(row, newAlignments));
  
  const newTableText = [headerRowText, separatorRow, ...dataRowsText].join('\n');
  
  return replaceTableInText(textarea, table, newTableText);
};

export const setColumnAlignment = (textarea, alignment) => {
  const table = parseTableAtCursor(textarea);
  if (!table) {
    console.log('No table found at cursor');
    return null;
  }
  
  const { headerRow, dataRows, alignments, currentColumn } = table;
  
  console.log('Setting column alignment:', { currentColumn, alignment });
  
  // Update alignment
  const newAlignments = [...alignments];
  while (newAlignments.length < headerRow.length) {
    newAlignments.push('left');
  }
  newAlignments[currentColumn] = alignment;
  
  // Rebuild table
  const headerRowText = buildTableRow(headerRow, newAlignments);
  const separatorRow = buildSeparatorRow(headerRow.length, newAlignments);
  const dataRowsText = dataRows.map(row => buildTableRow(row, newAlignments));
  
  const newTableText = [headerRowText, separatorRow, ...dataRowsText].join('\n');
  
  return replaceTableInText(textarea, table, newTableText);
};

function replaceTableInText(textarea, table, newTableText) {
  const { allLines, tableStartLine, tableEndLine } = table;
  
  // Replace the table lines in the full text
  const beforeTableLines = allLines.slice(0, tableStartLine);
  const afterTableLines = allLines.slice(tableEndLine + 1);
  
  // Rebuild content
  const newLines = [
    ...beforeTableLines,
    ...newTableText.split('\n'),
    ...afterTableLines
  ];
  
  const newContent = newLines.join('\n');
  
  // Calculate cursor position - place it at start of the new table
  const beforeTableText = beforeTableLines.join('\n');
  const cursorPos = beforeTableText.length + (beforeTableLines.length > 0 ? 1 : 0);
  
  console.log('Table replacement:', {
    tableStartLine,
    tableEndLine,
    beforeTableLines: beforeTableLines.length,
    afterTableLines: afterTableLines.length,
    newTableLines: newTableText.split('\n').length,
    cursorPos
  });
  
  return {
    content: newContent,
    cursorPos: cursorPos
  };
}