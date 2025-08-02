interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Simple markdown to JSX converter for basic elements
  const renderMarkdownContent = (markdown: string) => {
    const lines = markdown.split('\n');
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let key = 0;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={key++} className="list-disc list-inside mb-3 space-y-1">
            {currentList.map((item, index) => (
              <li key={index} className="text-base text-base-content/80">
                {renderInlineElements(item)}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    const renderInlineElements = (text: string) => {
      // Handle bold text
      let content = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Handle inline code
      content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
      
      // Split by HTML tags and render accordingly
      const parts = content.split(/(<\/?(?:strong|code)>)/);
      return parts.map((part, index) => {
        if (part === '<strong>') return null;
        if (part === '</strong>') return null;
        if (part === '<code>') return null;
        if (part === '</code>') return null;
        
        const prevTag = parts[index - 1];
        const nextTag = parts[index + 1];
        
        if (prevTag === '<strong>' && nextTag === '</strong>') {
          return <strong key={index} className="font-semibold text-primary">{part}</strong>;
        }
        if (prevTag === '<code>' && nextTag === '</code>') {
          return <code key={index} className="bg-base-200 px-1 py-0.5 rounded text-xs">{part}</code>;
        }
        
        return part;
      }).filter(Boolean);
    };

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        flushList();
        elements.push(<div key={key++} className="mb-2" />);
        return;
      }

      // Handle headers
      if (trimmedLine.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={key++} className="sticky top-0 bg-base-100 z-10 text-2xl font-bold pb-4 text-primary">
            {renderInlineElements(trimmedLine.substring(2))}
          </h1>
        );
      } else if (trimmedLine.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={key++} className="text-xl font-semibold mb-3 text-primary/80">
            {renderInlineElements(trimmedLine.substring(3))}
          </h2>
        );
      } else if (trimmedLine.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={key++} className="text-lg font-medium mb-2">
            {renderInlineElements(trimmedLine.substring(4))}
          </h3>
        );
      } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        // Handle list items
        currentList.push(trimmedLine.substring(2));
      } else if (trimmedLine === '---') {
        flushList();
        elements.push(<hr key={key++} className="my-6 border-base-300" />);
      } else {
        // Handle regular paragraphs
        flushList();
        elements.push(
          <p key={key++} className="mb-3 text-base text-base-content/80">
            {renderInlineElements(trimmedLine)}
          </p>
        );
      }
    });

    flushList(); // Flush any remaining list items
    return elements;
  };

  return (
    <div className="prose prose-sm max-w-none">
      {renderMarkdownContent(content)}
    </div>
  );
} 