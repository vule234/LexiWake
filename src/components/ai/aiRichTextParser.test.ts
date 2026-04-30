import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRichMessage } from './aiRichTextParser';

test('parses heading and bullet list blocks', () => {
  const blocks = parseRichMessage('## **Câu 8**\n\n- A) baby\n- B) adult');

  assert.equal(blocks[0]?.type, 'heading');
  assert.equal(blocks[1]?.type, 'list');
  if (blocks[1]?.type === 'list') {
    assert.equal(blocks[1].items.length, 2);
  }
});

test('parses markdown tables with headers', () => {
  const blocks = parseRichMessage('| Từ | Nghĩa |\n| --- | --- |\n| child | đứa trẻ |');

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0]?.type, 'table');
  if (blocks[0]?.type === 'table') {
    assert.equal(blocks[0].ascii, false);
    assert.equal(blocks[0].headers?.length, 2);
    assert.equal(blocks[0].rows.length, 1);
  }
});

test('parses ascii-style matching rows into table fallback', () => {
  const blocks = parseRichMessage('1. people | a) đàn ông |\n2. man | b) nhóm |');

  assert.equal(blocks[0]?.type, 'table');
  if (blocks[0]?.type === 'table') {
    assert.equal(blocks[0].ascii, true);
    assert.equal(blocks[0].rows.length, 2);
    assert.equal(blocks[0].rows[0]?.length, 2);
  }
});

test('keeps pipe text as paragraph when it is not a table', () => {
  const blocks = parseRichMessage('Dùng ký hiệu A | B để nhớ mẹo học.');

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0]?.type, 'paragraph');
});

test('removes repeated separators and keeps quiz answer section readable', () => {
  const blocks = parseRichMessage('### Kết quả\n---\n\n**Đáp án:** 1-c, 2-a\n\n---');

  assert.equal(blocks[0]?.type, 'heading');
  assert.equal(blocks[1]?.type, 'paragraph');
});
