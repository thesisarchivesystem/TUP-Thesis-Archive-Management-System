import { type ReactNode } from 'react';

type ChatMessageContentProps = {
  text: string;
  variant?: 'bot' | 'user';
};

type TextBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'section'; index: number; title: string; body: string }
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
const BOLD_PATTERN = /(\*\*|__)(.+?)\1/g;

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
  let currentSection: { index: number; title: string; bodyLines: string[] } | null = null;
  let sectionCounter = 0;

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

  const flushSection = () => {
    if (!currentSection) return;
    blocks.push({
      type: 'section',
      index: currentSection.index,
      title: currentSection.title,
      body: currentSection.bodyLines.join(' ').trim(),
    });
    currentSection = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim().replace(/^#{1,6}\s*/, '');

    if (!line) {
      if (currentSection) {
        currentSection.bodyLines.push('');
      } else {
        flushParagraph();
        flushList();
      }
      continue;
    }

    if (/^[-*_]{3,}$/.test(line)) {
      continue;
    }

    const sectionMatch = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (sectionMatch) {
      flushParagraph();
      flushList();
      flushSection();

      sectionCounter += 1;
      currentSection = {
        index: sectionCounter,
        title: sectionMatch[2].trim(),
        bodyLines: [],
      };
      continue;
    }

    if (currentSection) {
      currentSection.bodyLines.push(line);
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
  flushSection();

  return blocks;
}

function renderInlineMarkup(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  BOLD_PATTERN.lastIndex = 0;

  while ((match = BOLD_PATTERN.exec(text)) !== null) {
    const [fullMatch, , boldText] = match;
    const start = match.index;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    nodes.push(
      <strong key={`${start}-${boldText.length}`}>
        {boldText}
      </strong>
    );

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

        if (block.type === 'section') {
          return (
            <div className="vpaa-chat-message-section" key={`${block.type}-${index}`}>
              <div className="vpaa-chat-message-section-index">{block.index}.</div>
              <div className="vpaa-chat-message-section-content">
                <div className="vpaa-chat-message-section-title">
                  {renderInlineMarkup(block.title)}
                </div>
                {block.body ? (
                  <p className="vpaa-chat-message-section-body">
                    {renderInlineMarkup(block.body)}
                  </p>
                ) : null}
              </div>
            </div>
          );
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag className={`vpaa-chat-message-list ${block.ordered ? 'ordered' : 'unordered'}`} key={`${block.type}-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li className="vpaa-chat-message-item" key={`${index}-${itemIndex}`}>
                  {renderInlineMarkup(item)}
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
