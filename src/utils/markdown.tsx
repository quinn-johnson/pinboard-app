import React from 'react';

export const parseMarkdown = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    // Check for bullet points
    const bulletMatch = line.match(/^(\s*)([-*])\s+(.+)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      const content = bulletMatch[3];
      elements.push(
        <div key={lineIndex} style={{ marginLeft: `${indent * 8}px` }} className="flex items-start gap-2">
          <span className="text-gray-600 select-none">•</span>
          <span className="flex-1">{parseInlineMarkdown(content)}</span>
        </div>
      );
      return;
    }

    // Regular line
    if (line.trim()) {
      elements.push(
        <div key={lineIndex}>
          {parseInlineMarkdown(line)}
        </div>
      );
    } else {
      // Empty line = paragraph break
      elements.push(<div key={lineIndex} className="h-2" />);
    }
  });

  return <>{elements}</>;
};

const parseInlineMarkdown = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  const tokens: Array<{ type: string; start: number; end: number; content: string }> = [];

  // Find all formatting tokens
  const patterns = [
    { regex: /\*\*(.+?)\*\*/g, type: 'bold' },
    { regex: /\*(.+?)\*/g, type: 'italic' },
    { regex: /__(.+?)__/g, type: 'bold' },
    { regex: /_(.+?)_/g, type: 'italic' },
    { regex: /~~(.+?)~~/g, type: 'strikethrough' },
    { regex: /(https?:\/\/[^\s]+)/g, type: 'link' },
  ];

  patterns.forEach(({ regex, type }) => {
    let match;
    const re = new RegExp(regex);
    while ((match = re.exec(text)) !== null) {
      // Check if this position is not already covered by a token
      const overlaps = tokens.some(
        t => (match.index >= t.start && match.index < t.end) ||
             (match.index + match[0].length > t.start && match.index + match[0].length <= t.end)
      );

      if (!overlaps) {
        tokens.push({
          type,
          start: match.index,
          end: match.index + match[0].length,
          content: match[1] || match[0]
        });
      }
    }
  });

  // Sort tokens by start position
  tokens.sort((a, b) => a.start - b.start);

  // Build the result
  let keyCounter = 0;
  tokens.forEach(token => {
    // Add any text before this token
    if (currentIndex < token.start) {
      parts.push(
        <span key={`text-${keyCounter++}`}>
          {text.substring(currentIndex, token.start)}
        </span>
      );
    }

    // Add the formatted token
    switch (token.type) {
      case 'bold':
        parts.push(
          <strong key={`bold-${keyCounter++}`} className="font-semibold">
            {token.content}
          </strong>
        );
        break;
      case 'italic':
        parts.push(
          <em key={`italic-${keyCounter++}`} className="italic">
            {token.content}
          </em>
        );
        break;
      case 'strikethrough':
        parts.push(
          <span key={`strike-${keyCounter++}`} className="line-through text-gray-500">
            {token.content}
          </span>
        );
        break;
      case 'link':
        parts.push(
          <a
            key={`link-${keyCounter++}`}
            href={token.content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline break-all"
          >
            {token.content}
          </a>
        );
        break;
    }

    currentIndex = token.end;
  });

  // Add any remaining text
  if (currentIndex < text.length) {
    parts.push(
      <span key={`text-${keyCounter++}`}>
        {text.substring(currentIndex)}
      </span>
    );
  }

  return parts.length > 0 ? <>{parts}</> : text;
};

export const MarkdownHelp = () => (
  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 p-2 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600">
    <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Formatting:</div>
    <div><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">**bold**</code> or <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">__bold__</code> → <strong>bold</strong></div>
    <div><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">*italic*</code> or <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">_italic_</code> → <em>italic</em></div>
    <div><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">~~strikethrough~~</code> → <span className="line-through">strikethrough</span></div>
    <div><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">- bullet point</code> → bullet list</div>
  </div>
);
