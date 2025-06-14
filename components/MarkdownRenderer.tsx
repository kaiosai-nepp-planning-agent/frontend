import React from "react";
import ReactMarkdown, { Components } from "react-markdown"; // Components 型をインポート
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // カスタムコンポーネントを正しい型で定義します
  const customComponents: Components = {
    code: ({ className, children, ...props }) => {
      const isBlock = className && className.startsWith("language-");
      const match = /language-(\w+)/.exec(className || "");

      return isBlock && match ? (
        <pre
          style={{
            backgroundColor: "#f0f0f0",
            padding: "10px",
            borderRadius: "5px",
            overflowX: "auto",
            marginBottom: "1em",
          }}
        >
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code
          style={{
            backgroundColor: "#f0f0f0",
            padding: "2px 4px",
            borderRadius: "3px",
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    // ここから下のコンポーネントでは 'node' が使われていないため、分割代入から削除します
    h1: ({ ...props }) => (
      <h1 style={{ fontSize: "2em", marginBottom: "0.5em" }} {...props} />
    ),
    h2: ({ ...props }) => (
      <h2 style={{ fontSize: "1.5em", marginBottom: "0.5em" }} {...props} />
    ),
    p: ({ ...props }) => (
      <p style={{ lineHeight: "1.6", marginBottom: "1em" }} {...props} />
    ),
    a: ({ ...props }) => (
      <a style={{ color: "#1a73e8", textDecoration: "underline" }} {...props} />
    ),
    ul: ({ ...props }) => (
      <ul
        style={{
          listStyleType: "disc",
          marginLeft: "20px",
          marginBottom: "1em",
        }}
        {...props}
      />
    ),
    ol: ({ ...props }) => (
      <ol
        style={{
          listStyleType: "decimal",
          marginLeft: "20px",
          marginBottom: "1em",
        }}
        {...props}
      />
    ),
    li: ({ ...props }) => <li style={{ marginBottom: "0.5em" }} {...props} />,
    table: ({ ...props }) => (
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          marginBottom: "1em",
        }}
        {...props}
      />
    ),
    th: ({ ...props }) => (
      <th
        style={{
          border: "1px solid #ddd",
          padding: "8px",
          textAlign: "left",
          backgroundColor: "#f2f2f2",
        }}
        {...props}
      />
    ),
    td: ({ ...props }) => (
      <td
        style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}
        {...props}
      />
    ),
    blockquote: ({ ...props }) => (
      <blockquote
        style={{
          borderLeft: "4px solid #ccc",
          paddingLeft: "1em",
          color: "#666",
          fontStyle: "italic",
          margin: "1em 0",
        }}
        {...props}
      />
    ),
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents}>
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
