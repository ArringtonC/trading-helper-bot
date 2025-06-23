import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarkdownRenderer from './MarkdownRenderer';

// Mock react-markdown and rehype-highlight as they are external dependencies
// and we want to test our component's logic, not theirs directly in unit tests.
// Also, JSDOM doesn't fully support all browser APIs they might use.

const mockReactMarkdown = jest.fn(({ children }) => <div data-testid="mock-react-markdown">{children}</div>);
const mockRehypeHighlight = jest.fn();

jest.mock('react-markdown', () => (props: any) => mockReactMarkdown(props));
jest.mock('rehype-highlight', () => mockRehypeHighlight);


describe('MarkdownRenderer Component', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    mockReactMarkdown.mockClear();
    mockRehypeHighlight.mockClear();
  });

  test('renders basic markdown content via ReactMarkdown', () => {
    const markdown = '# Hello World\n\nThis is a paragraph.';
    render(<MarkdownRenderer markdownContent={markdown} />);

    expect(mockReactMarkdown).toHaveBeenCalledTimes(1);
    // Check that the markdown content is passed as children to ReactMarkdown
    expect(screen.getByTestId('mock-react-markdown')).toHaveTextContent(markdown);
    // Check that the prose class is applied for styling
    expect(screen.getByTestId('mock-react-markdown').parentElement).toHaveClass('prose');
  });

  test('passes rehypeHighlight to ReactMarkdown', () => {
    const markdown = '```js\nconsole.log("hello");\n```';
    render(<MarkdownRenderer markdownContent={markdown} />);
    
    expect(mockReactMarkdown).toHaveBeenCalledTimes(1);
    const reactMarkdownProps = mockReactMarkdown.mock.calls[0][0];
    expect(reactMarkdownProps.rehypePlugins).toBeDefined();
    // Check if rehypeHighlight is in the plugins array
    // This is a bit indirect due to the plugin array structure [[plugin, options]]
    const hasRehypeHighlight = reactMarkdownProps.rehypePlugins.some(
        (pluginEntry: any) => Array.isArray(pluginEntry) && pluginEntry[0] === mockRehypeHighlight
    );
    expect(hasRehypeHighlight).toBe(true);
  });

  test('applies custom className to the wrapper div', () => {
    const markdown = 'Some content';
    const customClass = 'my-custom-markdown-renderer';
    render(<MarkdownRenderer markdownContent={markdown} className={customClass} />);
    
    const wrapperDiv = screen.getByTestId('mock-react-markdown').parentElement;
    expect(wrapperDiv).toHaveClass(customClass);
  });

  test('configures custom \'a\' tag component for ReactMarkdown', () => {
    const markdown = '[A link](https://example.com)';
    render(<MarkdownRenderer markdownContent={markdown} />); 
    expect(mockReactMarkdown).toHaveBeenCalledTimes(1);
    const reactMarkdownProps = mockReactMarkdown.mock.calls[0][0];
    expect(reactMarkdownProps.components).toBeDefined();
    // Check that a function is provided for the 'a' tag component
    expect(typeof reactMarkdownProps.components.a).toBe('function');

    // Test the custom 'a' component behavior indirectly (if it were rendered by actual react-markdown)
    // For now, we just confirm it's passed.
    // To test it directly, you would need to extract the component and test it separately
    // or use a more complex integration test without mocking react-markdown.
  });

  test('renders correctly with empty markdown content', () => {
    render(<MarkdownRenderer markdownContent="" />);
    expect(mockReactMarkdown).toHaveBeenCalledWith(expect.objectContaining({ children: '' }));
    expect(screen.getByTestId('mock-react-markdown')).toHaveTextContent('');
  });

}); 