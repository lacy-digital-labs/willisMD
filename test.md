# willisMD Markdown Editor Test Document

This document contains comprehensive markdown content to test all features of the willisMD editor with CodeMirror integration.

## Text Formatting

### Basic Text Styling
- **Bold text** using double asterisks
- *Italic text* using single asterisks
- ***Bold and italic*** using triple asterisks
- ~~Strikethrough text~~ using double tildes
- `Inline code` using backticks
- Regular text for comparison

### Code Examples

#### Inline Code
Here's some `inline code` in a sentence. Variables like `userName` and `isActive` are commonly used.

#### Code Blocks

```javascript
// JavaScript example
function greetUser(name) {
    console.log(`Hello, ${name}!`);
    return `Welcome to willisMD, ${name}`;
}

const users = ['Alice', 'Bob', 'Charlie'];
users.forEach(user => greetUser(user));
```

```python
# Python example  
def calculate_factorial(n):
    if n <= 1:
        return 1
    return n * calculate_factorial(n - 1)

# Test the function
for i in range(1, 6):
    print(f"{i}! = {calculate_factorial(i)}")
```

```css
/* CSS example */
.editor-container {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 14px;
    line-height: 1.5;
    background-color: var(--bg-primary);
    color: var(--text-primary);
}

.toolbar button:hover {
    background-color: var(--accent-primary);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

## Headings Hierarchy

# Heading 1 - Main Title
## Heading 2 - Major Section  
### Heading 3 - Sub-section
#### Heading 4 - Sub-sub-section
##### Heading 5 - Minor heading
###### Heading 6 - Smallest heading

## Lists and Organization

### Unordered Lists
- First level item
- Another first level item
  - Nested second level
  - Another nested item
    - Third level nesting
    - More third level content
- Back to first level
- Final first level item

### Ordered Lists
1. First numbered item
2. Second numbered item
   1. Nested numbered item
   2. Another nested numbered
      1. Third level numbering
      2. More third level
3. Back to main sequence
4. Fourth main item
5. Final numbered item

### Mixed Lists
1. Ordered item with nested unordered:
   - Bullet point
   - Another bullet
   - Third bullet
2. Another ordered item
   - More nested bullets
     1. Nested ordered in unordered
     2. Another nested ordered
3. Final ordered item

### Task Lists
- [ ] Uncompleted task
- [x] Completed task
- [ ] Another pending task
- [x] Another completed task
- [ ] Task with **bold** text
- [x] Task with *italic* text

## Quotes and Citations

### Simple Blockquote
> This is a simple blockquote. It's used to highlight important text or quotes from other sources.

### Nested Blockquotes
> This is the first level of quoting.
> 
> > This is nested blockquote inside the first quote.
> > 
> > > This is a third level of nesting.
> 
> Back to the first level of quoting.

### Multi-paragraph Blockquote
> This is the first paragraph of a multi-paragraph quote.
> It spans multiple lines and demonstrates how quotes
> can contain extensive content.
>
> This is the second paragraph of the same quote.
> Notice how each paragraph is properly quoted.

## Links and References

### Various Link Types
- [Basic link to Google](https://www.google.com)
- [Link with title](https://www.github.com "GitHub Homepage")
- [Relative link to README](./README.md)
- [Email link](mailto:user@example.com)
- Auto-link: https://www.willismd.com
- Auto-email: test@example.com

### Reference Links
Here's a [reference link][1] and another [reference link][2].

You can also use [indirect references] and [case-insensitive references].

[1]: https://www.example.com "Example Site"
[2]: https://www.github.com "GitHub"
[indirect references]: https://www.willismd.com
[CASE-INSENSITIVE REFERENCES]: https://www.markdown.org

## Images and Media

### Regular Images
![Placeholder Image](https://via.placeholder.com/400x200/09f/fff.png "Placeholder")

### Images with Links
[![Linked Image](https://via.placeholder.com/200x100/f90/fff.png)](https://www.example.com)

### Reference Images
![Alternative text][logo]

[logo]: https://via.placeholder.com/150x75/0099ff/ffffff.png "Logo"

## Tables

### Simple Table
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1, Col 1 | Row 1, Col 2 | Row 1, Col 3 |
| Row 2, Col 1 | Row 2, Col 2 | Row 2, Col 3 |

### Aligned Table
| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Left | Center | Right |
| This is left | This is center | This is right |
| More content | More center | More right |

### Table with Formatting
| Feature | Status | Notes |
|---------|--------|-------|
| **Bold Text** | ✅ Complete | Working perfectly |
| *Italic Text* | ✅ Complete | Renders correctly |
| `Code Inline` | ✅ Complete | Syntax highlighting |
| ~~Strikethrough~~ | ✅ Complete | Recently fixed |
| [Links](https://example.com) | ✅ Complete | Clickable links |

### Complex Table
| Component | Language | Lines of Code | Status | Priority |
|-----------|----------|---------------|--------|----------|
| Editor | JavaScript | 2,500 | ✅ Complete | High |
| Preview | React | 800 | ✅ Complete | High |
| Toolbar | React | 1,200 | ✅ Complete | Medium |
| File Explorer | JavaScript | 600 | ✅ Complete | Medium |
| Preferences | JavaScript | 400 | ✅ Complete | Low |

## Horizontal Rules

Here's a horizontal rule using hyphens:

---

Here's one using asterisks:

***

Here's one using underscores:

___

## Special Characters and Escaping

### Escaped Characters
\*This is not italic\*
\`This is not code\`
\[This is not a link\]
\# This is not a heading

### Special Symbols
- © Copyright symbol
- ® Registered trademark
- ™ Trademark
- § Section symbol
- ¶ Paragraph symbol
- † Dagger
- ‡ Double dagger
- • Bullet point
- … Ellipsis
- – En dash
- — Em dash

## HTML Integration

### Allowed HTML Tags
<strong>HTML strong tag</strong>  
<em>HTML emphasis tag</em>  
<code>HTML code tag</code>  
<kbd>Keyboard input</kbd>  
<sub>Subscript</sub> and <sup>Superscript</sup>

### HTML Entities
&copy; &reg; &trade; &sect; &para; &dagger; &Dagger; &bull; &hellip; &ndash; &mdash;

## Line Breaks and Spacing

### Soft Line Breaks
This line ends with two spaces  
This creates a line break
Without starting a new paragraph

### Hard Line Breaks

This line has two line breaks after it


This creates more vertical space

### Non-breaking Spaces
Words&nbsp;connected&nbsp;with&nbsp;non-breaking&nbsp;spaces

## Complex Combinations

### List with Code Blocks
1. First item with code:
   ```bash
   npm install
   npm run build
   ```

2. Second item with quote:
   > This is a quote inside a list item.
   > It can span multiple lines.

3. Third item with table:
   | Command | Description |
   |---------|-------------|
   | `npm start` | Start development |
   | `npm build` | Build for production |

### Quote with Code
> Here's a quote that contains `inline code` and also:
> ```
> A code block inside
> the quoted text
> ```

### Nested Everything
1. **Ordered list** with *mixed* formatting
   - Unordered nested item with `code`
   - Another item with [link](https://example.com)
     > A quote inside a nested list
     > 
     > ```javascript
     > console.log("Code in quote in list");
     > ```
   - Back to unordered level
2. Second ordered item
   - More nesting with ~~strikethrough~~
   - And some **bold** with *italic* text

## Performance Testing Content

### Large List
1. Item 1 - Lorem ipsum dolor sit amet, consectetur adipiscing elit
2. Item 2 - Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua
3. Item 3 - Ut enim ad minim veniam, quis nostrud exercitation ullamco
4. Item 4 - Laboris nisi ut aliquip ex ea commodo consequat
5. Item 5 - Duis aute irure dolor in reprehenderit in voluptate velit esse
6. Item 6 - Cillum dolore eu fugiat nulla pariatur
7. Item 7 - Excepteur sint occaecat cupidatat non proident
8. Item 8 - Sunt in culpa qui officia deserunt mollit anim id est laborum
9. Item 9 - Sed ut perspiciatis unde omnis iste natus error sit voluptatem
10. Item 10 - Accusantium doloremque laudantium, totam rem aperiam

### Long Paragraph
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

## Edge Cases and Testing

### Empty Elements
- 
- Empty list item above
-   
- List item with spaces only above

### Weird Spacing
Paragraph    with    multiple    spaces    between    words.

Paragraph
with
line
breaks
without
double
spaces.

### Special Markdown Cases
- List item ending with period.
- List item ending with question mark?
- List item ending with exclamation mark!
- List item with... ellipsis
- List item with -- dashes
- List item with (parentheses)
- List item with [brackets]
- List item with {braces}

### URL Edge Cases
- HTTP: http://example.com
- HTTPS: https://example.com
- FTP: ftp://files.example.com
- With port: https://example.com:8080
- With path: https://example.com/path/to/file
- With query: https://example.com/search?q=markdown
- With fragment: https://example.com/page#section

---

## Testing Checklist

Use this document to test:
- [ ] All text formatting (bold, italic, strikethrough, code)
- [ ] All heading levels (H1-H6)
- [ ] Unordered and ordered lists
- [ ] Nested lists and mixed lists
- [ ] Blockquotes and nested quotes
- [ ] Links (inline, reference, auto)
- [ ] Images (inline, reference, linked)
- [ ] Tables (simple, aligned, complex)
- [ ] Code blocks with syntax highlighting
- [ ] Horizontal rules
- [ ] HTML tags and entities
- [ ] Line breaks and spacing
- [ ] Complex nested structures
- [ ] Performance with large content
- [ ] Edge cases and special characters

**This document demonstrates the full power of the willisMD editor!** 🚀