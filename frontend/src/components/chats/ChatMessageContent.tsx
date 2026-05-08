import { type ReactNode } from 'react';

type ChatMessageContentProps = {
  text: string;
  variant?: 'bot' | 'user';
};

type TextBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] };

const STRUCTURE_LABELS = new Set([
  'title/topic',
  'title',
  'topic',
  'short explanation',
  'steps or key details',
  'optional note or reminder',
  'note',
  'reminder',
]);

const LIST_PATTERN = /^(\d+)[.)]\s+(.+)$|^[-*\u2022]\s+(.+)$/;
const INLINE_PATTERN = /(`([^`]+)`)|(\*\*|__)(.+?)\3|(==(.+?)==)|(\/(?:student|faculty|vpaa|sign-in|forgot-password|reset-password)[^\s.,)]*)/g;
const LEAD_LABEL_PATTERN = /^([^:]{2,42}):\s+(.+)$/;

function isHeadingLine(line: string): boolean {
  const normalized = line.replace(/:$/, '').trim().toLowerCase();
  if (STRUCTURE_LABELS.has(normalized)) {
    return true;
  }

  if (line.endsWith(':')) {
    return true;
  }

  return line.length <= 60 && /^[A-Z0-9]/.test(line) && !/[.?!]$/.test(line);
}

function parseBlocks(text: string): TextBlock[] {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: TextBlock[] = [];
  let paragraphBuffer: string[] = [];
  let listBuffer: { ordered: boolean; items: string[] } | null = null;
  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    blocks.push({ type: 'paragraph', text: paragraphBuffer.join(' ').trim() });
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (!listBuffer || !listBuffer.items.length) return;
    blocks.push({ type: 'list', ordered: listBuffer.ordered, items: [...listBuffer.items] });
    listBuffer = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim().replace(/^#{1,6}\s*/, '');

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (/^[-*_]{3,}$/.test(line)) {
      continue;
    }

    const listMatch = line.match(LIST_PATTERN);
    if (listMatch) {
      flushParagraph();
      const ordered = Boolean(listMatch[1]);
      const itemText = (listMatch[2] ?? listMatch[3] ?? '').trim();
      if (!listBuffer || listBuffer.ordered !== ordered) {
        flushList();
        listBuffer = { ordered, items: [] };
      }

      listBuffer.items.push(itemText);
      continue;
    }

    flushList();

    if (isHeadingLine(line)) {
      flushParagraph();
      blocks.push({ type: 'heading', text: line.replace(/:$/, '').trim() });
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

function renderInlineMarkup(text: string, options: { emphasizeLeadLabel?: boolean } = {}): ReactNode[] {
  if (options.emphasizeLeadLabel) {
    const leadMatch = text.match(LEAD_LABEL_PATTERN);
    if (leadMatch && /^[A-Z0-9]/.test(leadMatch[1]) && !leadMatch[1].includes('/')) {
      return [
        <strong className="vpaa-chat-message-label" key="lead-label">
          {leadMatch[1]}:
        </strong>,
        ' ',
        ...renderInlineMarkup(leadMatch[2]),
      ];
    }
  }

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  INLINE_PATTERN.lastIndex = 0;

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    const [fullMatch, , codeText, , boldText, , highlightText, pathText] = match;
    const start = match.index;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    if (codeText) {
      nodes.push(
        <code className="vpaa-chat-message-code" key={`${start}-code`}>
          {codeText}
        </code>
      );
    } else if (boldText) {
      nodes.push(
        <strong key={`${start}-bold`}>
          {boldText}
        </strong>
      );
    } else if (highlightText) {
      nodes.push(
        <mark className="vpaa-chat-message-highlight" key={`${start}-highlight`}>
          {highlightText}
        </mark>
      );
    } else if (pathText) {
      nodes.push(
        <span className="vpaa-chat-message-path" key={`${start}-path`}>
          {pathText}
        </span>
      );
    }

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : [text];
}

export default function ChatMessageContent({ text, variant = 'bot' }: ChatMessageContentProps) {
  if (variant === 'user') {
    return <span className="vpaa-chat-message-user">{renderInlineMarkup(text)}</span>;
  }

  const blocks = parseBlocks(text);

  if (!blocks.length) {
    return <p className="vpaa-chat-message-paragraph">{renderInlineMarkup(text)}</p>;
  }

  return (
    <div className="vpaa-chat-message-content">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <div className="vpaa-chat-message-heading" key={`${block.type}-${index}`}>
              {renderInlineMarkup(block.text)}
            </div>
          );
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag className={`vpaa-chat-message-list ${block.ordered ? 'ordered' : 'unordered'}`} key={`${block.type}-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li className="vpaa-chat-message-item" key={`${index}-${itemIndex}`}>
                  {renderInlineMarkup(item, { emphasizeLeadLabel: true })}
                </li>
              ))}
            </ListTag>
          );
        }

        return (
          <p className="vpaa-chat-message-paragraph" key={`${block.type}-${index}`}>
            {renderInlineMarkup(block.text)}
          </p>
        );
      })}
    </div>
  );
}
