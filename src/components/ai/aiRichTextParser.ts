export type InlineSegment = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
};

export type RichTableBlock = {
  type: 'table';
  headers?: InlineSegment[][];
  rows: InlineSegment[][][];
  ascii: boolean;
};

export type RichListBlock = {
  type: 'list';
  ordered: boolean;
  items: InlineSegment[][];
};

export type RichMessageBlock =
  | { type: 'heading'; level: 1 | 2 | 3; content: InlineSegment[] }
  | { type: 'paragraph'; content: InlineSegment[] }
  | { type: 'quote'; content: InlineSegment[] }
  | { type: 'code'; content: string }
  | { type: 'table'; headers?: InlineSegment[][]; rows: InlineSegment[][][]; ascii: boolean }
  | RichListBlock;

const normalizeMessageText = (rawText: string) => {
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''));

  const normalized: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      if (normalized[normalized.length - 1] !== '') {
        normalized.push('');
      }
      continue;
    }

    if (trimmed === '' && normalized[normalized.length - 1] === '') {
      continue;
    }

    normalized.push(line);
  }

  while (normalized[0] === '') {
    normalized.shift();
  }

  while (normalized[normalized.length - 1] === '') {
    normalized.pop();
  }

  return normalized;
};

const isMarkdownTableSeparator = (line: string) =>
  /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());

const parsePipeCells = (line: string) => {
  const trimmed = line.trim();
  const core = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const withoutTrailing = core.endsWith('|') ? core.slice(0, -1) : core;
  return withoutTrailing
    .split('|')
    .map((cell) => cell.trim())
    .filter((cell, index, all) => cell !== '' || all.length === 1 || index < all.length - 1);
};

const looksLikePipeTableRow = (line: string) => {
  if (!line.includes('|')) {
    return false;
  }

  const cells = parsePipeCells(line);
  return cells.length >= 2;
};

const stripHeadingPrefix = (line: string) => {
  const matched = line.match(/^(#{1,3})\s+(.*)$/);
  if (!matched) {
    return null;
  }

  return {
    level: matched[1].length as 1 | 2 | 3,
    text: matched[2].trim(),
  };
};

const stripListPrefix = (line: string) => {
  const trimmed = line.trim();
  const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
  if (bulletMatch) {
    return { ordered: false, text: bulletMatch[1].trim() };
  }

  const orderedMatch = trimmed.match(/^\d+[.)]\s+(.*)$/);
  if (orderedMatch) {
    return { ordered: true, text: orderedMatch[1].trim() };
  }

  return null;
};

export const parseInlineSegments = (rawText: string): InlineSegment[] => {
  const segments: InlineSegment[] = [];
  let buffer = '';
  let bold = false;
  let italic = false;
  let code = false;
  let index = 0;

  const pushBuffer = () => {
    if (!buffer) {
      return;
    }

    segments.push({
      text: buffer,
      bold,
      italic,
      code,
    });
    buffer = '';
  };

  while (index < rawText.length) {
    if (rawText.startsWith('**', index)) {
      pushBuffer();
      bold = !bold;
      index += 2;
      continue;
    }

    if (rawText[index] === '`') {
      pushBuffer();
      code = !code;
      index += 1;
      continue;
    }

    if (rawText[index] === '*') {
      pushBuffer();
      italic = !italic;
      index += 1;
      continue;
    }

    buffer += rawText[index];
    index += 1;
  }

  pushBuffer();

  return segments.length ? segments : [{ text: rawText }];
};

const detectPipeTable = (lines: string[], startIndex: number) => {
  const collected: string[] = [];
  let cursor = startIndex;

  while (cursor < lines.length) {
    const line = lines[cursor];
    const trimmed = line.trim();

    if (!trimmed) {
      break;
    }

    if (!looksLikePipeTableRow(trimmed) && !isMarkdownTableSeparator(trimmed)) {
      break;
    }

    collected.push(trimmed);
    cursor += 1;
  }

  if (collected.length < 2) {
    return null;
  }

  const separatorIndex = collected.findIndex((line) => isMarkdownTableSeparator(line));
  const bodyLines = separatorIndex >= 0 ? collected.filter((_, index) => index !== separatorIndex) : collected;
  const parsedRows = bodyLines.map(parsePipeCells);
  const width = Math.max(...parsedRows.map((row) => row.length));

  if (width < 2) {
    return null;
  }

  const normalizedRows = parsedRows.map((row) =>
    Array.from({ length: width }, (_, index) => row[index] || '')
  );

  if (separatorIndex >= 0) {
    const [headerRow, ...body] = normalizedRows;
    return {
      nextIndex: cursor,
      block: {
        type: 'table' as const,
        headers: headerRow.map(parseInlineSegments),
        rows: body.map((row) => row.map(parseInlineSegments)),
        ascii: false,
      },
    };
  }

  return {
    nextIndex: cursor,
    block: {
      type: 'table' as const,
      rows: normalizedRows.map((row) => row.map(parseInlineSegments)),
      ascii: true,
    },
  };
};

export const parseRichMessage = (rawText: string): RichMessageBlock[] => {
  const lines = normalizeMessageText(rawText);
  const blocks: RichMessageBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const pipeTable = detectPipeTable(lines, index);
    if (pipeTable) {
      blocks.push(pipeTable.block);
      index = pipeTable.nextIndex;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      blocks.push({ type: 'code', content: codeLines.join('\n') });
      continue;
    }

    const heading = stripHeadingPrefix(trimmed);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading.level,
        content: parseInlineSegments(heading.text),
      });
      index += 1;
      continue;
    }

    if (trimmed.startsWith('>')) {
      blocks.push({
        type: 'quote',
        content: parseInlineSegments(trimmed.replace(/^>\s?/, '')),
      });
      index += 1;
      continue;
    }

    const listPrefix = stripListPrefix(trimmed);
    if (listPrefix) {
      const items: InlineSegment[][] = [];
      const ordered = listPrefix.ordered;

      while (index < lines.length) {
        const current = lines[index].trim();
        if (!current) {
          break;
        }
        const parsed = stripListPrefix(current);
        if (!parsed || parsed.ordered !== ordered) {
          break;
        }
        items.push(parseInlineSegments(parsed.text));
        index += 1;
      }

      blocks.push({
        type: 'list',
        ordered,
        items,
      });
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;

    while (index < lines.length) {
      const next = lines[index].trim();
      if (!next) {
        break;
      }
      if (
        detectPipeTable(lines, index) ||
        next.startsWith('```') ||
        next.startsWith('>') ||
        stripHeadingPrefix(next) ||
        stripListPrefix(next)
      ) {
        break;
      }
      paragraphLines.push(next);
      index += 1;
    }

    blocks.push({
      type: 'paragraph',
      content: parseInlineSegments(paragraphLines.join('\n')),
    });
  }

  return blocks;
};
