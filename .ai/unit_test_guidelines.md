# Unit Test Guidelines for willisMD

This document provides standards and patterns for writing unit tests in the willisMD project.

## General Guidelines
- Test one unit of logic per test case.
- Use descriptive test names ("should do X when Y").
- Mock external dependencies and side effects.
- Place tests in `__tests__/` folders or alongside source files.

## Structure
- Arrange-Act-Assert pattern:
  - **Arrange**: Set up test data and mocks.
  - **Act**: Execute the function/component.
  - **Assert**: Verify the result.

## Tools
- **Recommended**: Jest, React Testing Library

## Example
```js
describe('MarkdownUtils', () => {
  it('should parse headings correctly', () => {
    // Arrange
    const input = '# Title';
    // Act
    const result = parseMarkdown(input);
    // Assert
    expect(result.headings[0]).toBe('Title');
  });
});
```

> Follow these guidelines to ensure consistent, maintainable, and effective tests.
