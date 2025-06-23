import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
// Note: Ensure you have a highlight.js CSS theme imported in your project, 
// e.g., import 'highlight.js/styles/github.css'; in your App.tsx or global styles.

interface MarkdownRendererProps {
  markdownContent: string;
  className?: string;
  // You can add more customization props here if needed, e.g., for custom components
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  markdownContent,
  className = '',
}) => {
  return (
    <div className={`prose max-w-none ${className}`}> {/* Using Tailwind CSS prose for nice defaults */}
      <ReactMarkdown
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          // Example: Custom renderer for links to open in a new tab
          a: ({ node, ...htmlProps }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { node?: any }) => (
            <a {...htmlProps} target="_blank" rel="noopener noreferrer" />
          ),
          // Example: Custom renderer for code blocks to add a copy button or other features
          // code({node, inline, className, children, ...props}) {
          //   const match = /language-(\w+)/.exec(className || '')
          //   return !inline && match ? (
          //     <div style={{position: 'relative'}}>
          //       <pre {...props} className={className}>{children}</pre>
          //       {/* Add copy button here */}
          //     </div>
          //   ) : (
          //     <code {...props} className={className}>
          //       {children}
          //     </code>
          //   )
          // },
        }}
      >
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer; 