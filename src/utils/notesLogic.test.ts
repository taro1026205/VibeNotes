import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterAndSortNotes,
  computeNoteMetrics,
  extractPlainTextSnippet,
  createNewNoteItem,
  applyMarkdownInsertion,
  NoteItem,
} from './notesLogic';

const sampleNotes: NoteItem[] = [
  {
    id: '1',
    title: 'Alpha Note',
    content: 'First note about frontend engineering',
    tag: 'indigo',
    pinned: false,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: '2',
    title: 'BetaPinned Note',
    content: 'Pinned grocery list: milk, coffee, oats',
    tag: 'emerald',
    pinned: true,
    createdAt: '2026-09-15T10:00:00.000Z',
    updatedAt: '2026-09-15T10:00:00.000Z',
  },
  {
    id: '3',
    title: 'Gamma Recent Note',
    content: 'Latest research on distributed systems',
    tag: 'indigo',
    pinned: false,
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
  },
];

test('filterAndSortNotes places pinned notes first, then sorts by updatedAt descending', () => {
  const result = filterAndSortNotes(sampleNotes, '', 'all');
  assert.equal(result.length, 3);
  assert.equal(result[0].id, '2'); // Pinned
  assert.equal(result[1].id, '3'); // More recent unpinned
  assert.equal(result[2].id, '1'); // Older unpinned
});

test('filterAndSortNotes filters by search query across title and content', () => {
  const byContent = filterAndSortNotes(sampleNotes, 'coffee', 'all');
  assert.equal(byContent.length, 1);
  assert.equal(byContent[0].id, '2');

  const byTitle = filterAndSortNotes(sampleNotes, 'gamma', 'all');
  assert.equal(byTitle.length, 1);
  assert.equal(byTitle[0].id, '3');
});

test('filterAndSortNotes filters by tag category accurately', () => {
  const indigoOnly = filterAndSortNotes(sampleNotes, '', 'indigo');
  assert.equal(indigoOnly.length, 2);
  assert.equal(indigoOnly[0].id, '3');
  assert.equal(indigoOnly[1].id, '1');
});

test('computeNoteMetrics calculates words, characters, lines, and reading time', () => {
  const metrics = computeNoteMetrics('Hello world\nThis is a five word line');
  assert.equal(metrics.words, 8);
  assert.equal(metrics.lines, 2);
  assert.equal(metrics.readingTimeMin, 1);

  const emptyMetrics = computeNoteMetrics('   ');
  assert.equal(emptyMetrics.words, 0);
  assert.equal(emptyMetrics.readingTimeMin, 0);
});

test('extractPlainTextSnippet strips leading H1 and markdown syntax while preserving hyphenated words', () => {
  const snippet = extractPlainTextSnippet(
    '# Heading\n\nSome **bold** distraction-free and [link](https://example.com) text.'
  );
  assert.equal(snippet, 'Some bold distraction-free and link text.');
});

test('createNewNoteItem generates valid default note structure', () => {
  const note = createNewNoteItem({ title: 'Custom Title', tag: 'rose' });
  assert.equal(note.title, 'Custom Title');
  assert.equal(note.tag, 'rose');
  assert.equal(note.pinned, false);
  assert.ok(note.id.startsWith('note-'));
});

test('applyMarkdownInsertion wraps selected text or inserts default placeholder for bold, italic, lists, and headers', () => {
  const resBold = applyMarkdownInsertion('Hello world', 6, 11, '**', '**', 'bold');
  assert.equal(resBold.updatedContent, 'Hello **world**');
  assert.equal(resBold.nextSelectionStart, 8);
  assert.equal(resBold.nextSelectionEnd, 13);

  const resHeader = applyMarkdownInsertion('', 0, 0, '## ', '', 'Section Heading');
  assert.equal(resHeader.updatedContent, '## Section Heading');
  assert.equal(resHeader.nextSelectionStart, 3);
  assert.equal(resHeader.nextSelectionEnd, 18);
});
