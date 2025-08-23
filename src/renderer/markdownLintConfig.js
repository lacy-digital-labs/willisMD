// Default markdownlint configuration for willisMD
const defaultLintConfig = {
  // Enable all rules by default, then customize
  "default": true,
  
  // MD001 - Header levels should only increment by one level at a time
  "MD001": true,
  
  // MD003 - Header style (atx_closed, atx, setext, setext_with_atx)
  "MD003": { "style": "atx" },
  
  // MD004 - Unordered list style (asterisk, plus, dash, consistent)
  "MD004": { "style": "consistent" },
  
  // MD005 - Inconsistent indentation for list items at the same level
  "MD005": true,
  
  // MD007 - Unordered list indentation
  "MD007": { "indent": 2 },
  
  // MD009 - Trailing spaces
  "MD009": {
    "br_spaces": 2,  // Allow 2 spaces for line breaks
    "list_item_empty_lines": false
  },
  
  // MD010 - Hard tabs
  "MD010": { "code_blocks": false },
  
  // MD012 - Multiple consecutive blank lines
  "MD012": { "maximum": 2 },
  
  // MD013 - Line length
  "MD013": {
    "line_length": 120,
    "code_blocks": false,
    "tables": false,
    "headings": false
  },
  
  // MD014 - Dollar signs used before commands without showing output
  "MD014": false, // Disable as it can be annoying for code examples
  
  // MD022 - Headers should be surrounded by blank lines
  "MD022": {
    "lines_above": 1,
    "lines_below": 1
  },
  
  // MD024 - Multiple headers with the same content
  "MD024": { "siblings_only": true },
  
  // MD025 - Multiple top-level headers in the same document
  "MD025": true,
  
  // MD026 - Trailing punctuation in header
  "MD026": { "punctuation": ".,;:!" },
  
  // MD028 - Blank line inside blockquote
  "MD028": false,
  
  // MD029 - Ordered list item prefix
  "MD029": { "style": "ordered" },
  
  // MD030 - Spaces after list markers
  "MD030": {
    "ul_single": 1,
    "ol_single": 1,
    "ul_multi": 1,
    "ol_multi": 1
  },
  
  // MD031 - Fenced code blocks should be surrounded by blank lines
  "MD031": true,
  
  // MD032 - Lists should be surrounded by blank lines
  "MD032": true,
  
  // MD033 - Inline HTML
  "MD033": false, // Allow inline HTML
  
  // MD034 - Bare URL used
  "MD034": true,
  
  // MD035 - Horizontal rule style
  "MD035": { "style": "---" },
  
  // MD036 - Emphasis used instead of a header
  "MD036": true,
  
  // MD037 - Spaces inside emphasis markers
  "MD037": true,
  
  // MD038 - Spaces inside code span elements
  "MD038": true,
  
  // MD039 - Spaces inside link text
  "MD039": true,
  
  // MD040 - Fenced code blocks should have a language specified
  "MD040": false, // Don't require language specification
  
  // MD041 - First line in file should be a top level header
  "MD041": false, // Don't require as frontmatter may be first
  
  // MD042 - No empty links
  "MD042": true,
  
  // MD043 - Required header structure
  "MD043": false, // Don't enforce specific structure
  
  // MD044 - Proper names should have the correct capitalization
  "MD044": false, // Disable as it's too opinionated
  
  // MD045 - Images should have alternate text (alt text)
  "MD045": true,
  
  // MD046 - Code block style (fenced, indented, consistent)
  "MD046": { "style": "fenced" },
  
  // MD047 - Files should end with a single newline character
  "MD047": true,
  
  // MD048 - Code fence style (backtick, tilde, consistent)
  "MD048": { "style": "backtick" },
  
  // MD049 - Emphasis style (underscore, asterisk, consistent)
  "MD049": { "style": "consistent" },
  
  // MD050 - Strong style (underscore, asterisk, consistent)
  "MD050": { "style": "consistent" }
};

// Severity levels for different rule categories
const ruleSeverity = {
  // Errors - broken syntax that prevents rendering
  errors: [
    "MD045", // Images without alt text
    "MD042", // Empty links
    "MD037", // Spaces inside emphasis markers
    "MD038", // Spaces inside code span elements
    "MD039"  // Spaces inside link text
  ],
  
  // Warnings - potential issues or style inconsistencies
  warnings: [
    "MD001", // Header increment
    "MD003", // Header style
    "MD004", // List marker style
    "MD005", // List indentation
    "MD009", // Trailing spaces
    "MD010", // Hard tabs
    "MD022", // Headers surrounded by blank lines
    "MD024", // Duplicate headers
    "MD025", // Multiple top-level headers
    "MD026", // Trailing punctuation in header
    "MD031", // Code blocks surrounded by blank lines
    "MD032", // Lists surrounded by blank lines
    "MD034", // Bare URLs
    "MD035", // Horizontal rule style
    "MD036", // Emphasis instead of header
    "MD046", // Code block style
    "MD047", // File ending with newline
    "MD048", // Code fence style
    "MD049", // Emphasis style
    "MD050"  // Strong style
  ],
  
  // Info - style suggestions and best practices
  info: [
    "MD007", // List indentation
    "MD012", // Multiple blank lines
    "MD013", // Line length
    "MD029", // Ordered list prefix
    "MD030"  // Spaces after list markers
  ]
};

// Function to get severity for a rule
function getRuleSeverity(ruleId) {
  if (ruleSeverity.errors.includes(ruleId)) return 'error';
  if (ruleSeverity.warnings.includes(ruleId)) return 'warning';
  if (ruleSeverity.info.includes(ruleId)) return 'info';
  return 'warning'; // Default to warning
}

// Function to merge user config with defaults
function mergeConfig(userConfig = {}) {
  return { ...defaultLintConfig, ...userConfig };
}

// Function to convert markdownlint results to CodeMirror diagnostics
function convertToDiagnostics(results, doc) {
  const diagnostics = [];
  
  for (const [, fileErrors] of Object.entries(results)) {
    for (const error of fileErrors) {
      const lineNumber = error.lineNumber - 1; // Convert to 0-based
      const line = doc.line(lineNumber + 1);
      const severity = getRuleSeverity(error.ruleNames[0]);
      
      diagnostics.push({
        from: line.from,
        to: line.to,
        severity: severity,
        message: `${error.ruleDescription} (${error.ruleNames.join(', ')})`,
        source: 'markdownlint',
        rule: error.ruleNames[0]
      });
    }
  }
  
  return diagnostics;
}

// Export configuration and utilities
module.exports = {
  defaultLintConfig,
  ruleSeverity,
  getRuleSeverity,
  mergeConfig,
  convertToDiagnostics
};