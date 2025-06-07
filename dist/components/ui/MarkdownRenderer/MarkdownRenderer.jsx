var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
var MarkdownRenderer = function (_a) {
    var markdownContent = _a.markdownContent, _b = _a.className, className = _b === void 0 ? '' : _b;
    return (<div className={"prose max-w-none ".concat(className)}> {/* Using Tailwind CSS prose for nice defaults */}
      <ReactMarkdown rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]} components={{
            // Example: Custom renderer for links to open in a new tab
            a: function (_a) {
                var node = _a.node, htmlProps = __rest(_a, ["node"]);
                return (<a {...htmlProps} target="_blank" rel="noopener noreferrer"/>);
            },
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
        }}>
        {markdownContent}
      </ReactMarkdown>
    </div>);
};
export default MarkdownRenderer;
