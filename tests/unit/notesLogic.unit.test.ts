import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TAG_CATEGORIES,
  NoteItem,
  createNewNoteItem,
  getTagMetadata,
  createCustomFilter,
  deleteFilterFromList,
  moveNoteToFilter,
  filterAndSortNotes,
  computeNoteMetrics,
  extractPlainTextSnippet,
  applyMarkdownInsertion,
  getMarkdownAutocompleteSuggestions,
  applyAutocompleteSuggestion,
  computeSyncedScrollTop,
  formatPdfFilename,
  buildPrintableNoteHtml,
  createInitialHistoryState,
  pushEditorHistory,
  undoEditorHistory,
  redoEditorHistory,
  KEYBOARD_SHORTCUTS,
  cycleEditorViewMode,
  resolveGlobalShortcutAction,
} from '../../src/utils/notesLogic';

const mockNotes: NoteItem[] = [
  {
    id: 'note-1',
    title: 'Architecture Blueprint',
    content: '# Architecture\n\nSystem design for distributed storage.',
    tag: 'indigo',
    pinned: false,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'note-2',
    title: 'Sprint Retrospective',
    content: 'Action items: improve unit test coverage and CI speed.',
    tag: 'emerald',
    pinned: true,
    createdAt: '2026-09-20T08:00:00.000Z',
    updatedAt: '2026-09-20T08:00:00.000Z',
  },
  {
    id: 'note-3',
    title: 'Research Paper Summary',
    content: 'Notes on local-first CRDTs and offline persistence.',
    tag: 'sky',
    pinned: false,
    createdAt: '2026-10-15T08:00:00.000Z',
    updatedAt: '2026-10-15T08:00:00.000Z',
  },
];

test('[Unit] createNewNoteItem creates a valid note with defaults and custom overrides', () => {
  const defaultNote = createNewNoteItem();
  assert.ok(defaultNote.id.startsWith('note-'));
  assert.equal(defaultNote.title, 'Untitled Note');
  assert.equal(defaultNote.pinned, false);

  const customNote = createNewNoteItem({
    title: 'Kế hoạch học tập',
    content: '# Tuần 1',
    tag: 'amber',
    pinned: true,
  });
  assert.equal(customNote.title, 'Kế hoạch học tập');
  assert.equal(customNote.content, '# Tuần 1');
  assert.equal(customNote.tag, 'amber');
  assert.equal(customNote.pinned, true);
});

test('[Unit] filterAndSortNotes sorts pinned first, then updatedAt descending, and searches title/content/filter', () => {
  const allSorted = filterAndSortNotes(mockNotes, '', 'all', TAG_CATEGORIES);
  assert.deepEqual(
    allSorted.map((n) => n.id),
    ['note-2', 'note-3', 'note-1']
  );

  // Search by Title
  const byTitle = filterAndSortNotes(mockNotes, 'blueprint', 'all', TAG_CATEGORIES);
  assert.equal(byTitle.length, 1);
  assert.equal(byTitle[0].id, 'note-1');

  // Search by Content
  const byContent = filterAndSortNotes(mockNotes, 'crdts', 'all', TAG_CATEGORIES);
  assert.equal(byContent.length, 1);
  assert.equal(byContent[0].id, 'note-3');

  // Search by Filter Label ('Personal' -> 'emerald' -> 'note-2')
  const byFilter = filterAndSortNotes(mockNotes, 'Personal', 'all', TAG_CATEGORIES);
  assert.equal(byFilter.length, 1);
  assert.equal(byFilter[0].id, 'note-2');
});

test('[Unit] createCustomFilter and deleteFilterFromList handle filter lifecycle and note reassignment', () => {
  // Reject empty label
  const emptyRes = createCustomFilter(TAG_CATEGORIES, '   ');
  assert.equal(emptyRes.createdFilter, null);
  assert.ok(emptyRes.error);

  // Create valid filter
  const createdRes = createCustomFilter(TAG_CATEGORIES, 'Backend API');
  assert.ok(createdRes.createdFilter);
  assert.ok(createdRes.createdFilter?.id.startsWith('filter-backend-api'));
  assert.equal(createdRes.createdFilter?.label, 'Backend API');

  // Reject duplicate filter (returns error and does not add duplicate entry)
  const dupRes = createCustomFilter(createdRes.updatedFilters, 'backend api');
  assert.ok(dupRes.error);
  assert.equal(dupRes.updatedFilters.length, createdRes.updatedFilters.length);

  // Delete preset filter 'indigo' -> reassigns 'note-1' to first remaining filter ('emerald')
  const afterDelete = deleteFilterFromList(
    createdRes.updatedFilters,
    mockNotes,
    'indigo'
  );
  assert.equal(
    afterDelete.updatedFilters.some((f) => f.id === 'indigo'),
    false
  );
  assert.equal(
    afterDelete.updatedNotes.find((n) => n.id === 'note-1')?.tag,
    'emerald'
  );
});

test('[Unit] applyMarkdownInsertion wraps selected text or inserts placeholder with accurate cursor range', () => {
  const wrapped = applyMarkdownInsertion('Hello world', 6, 11, '**', '**', 'bold');
  assert.equal(wrapped.updatedContent, 'Hello **world**');
  assert.equal(wrapped.nextSelectionStart, 8);
  assert.equal(wrapped.nextSelectionEnd, 13);

  const placeholder = applyMarkdownInsertion('Title', 5, 5, '\n- [ ] ', '', 'Task item');
  assert.equal(placeholder.updatedContent, 'Title\n- [ ] Task item');
});

test('[Unit] getMarkdownAutocompleteSuggestions and applyAutocompleteSuggestion handle slash and prefix triggers', () => {
  const slashCtx = getMarkdownAutocompleteSuggestions('Intro\n/ta', 9);
  assert.ok(slashCtx);
  assert.equal(slashCtx?.query, '/ta');
  const tableSuggestion = slashCtx?.suggestions.find((s) => s.id === 'table');
  assert.ok(tableSuggestion);

  if (slashCtx && tableSuggestion) {
    const applied = applyAutocompleteSuggestion('Intro\n/ta', slashCtx, tableSuggestion);
    assert.ok(applied.updatedContent.includes('| Column 1 | Column 2 |'));
  }
});

test('[Unit] Undo and Redo history stack functions preserve content and selection positions', () => {
  let state = createInitialHistoryState('Initial', 7, 7);
  state = pushEditorHistory(state, {
    content: 'Initial\nSecond',
    selectionStart: 14,
    selectionEnd: 14,
  });
  state = pushEditorHistory(state, {
    content: 'Initial\nSecond\nThird',
    selectionStart: 20,
    selectionEnd: 20,
  });

  const undoStep = undoEditorHistory(state);
  assert.equal(undoStep.restored?.content, 'Initial\nSecond');
  assert.equal(undoStep.restored?.selectionStart, 14);

  const redoStep = redoEditorHistory(undoStep.nextState);
  assert.equal(redoStep.restored?.content, 'Initial\nSecond\nThird');
  assert.equal(redoStep.restored?.selectionStart, 20);
});

test('[Unit] computeSyncedScrollTop, computeNoteMetrics, extractPlainTextSnippet, and PDF helpers', () => {
  assert.equal(computeSyncedScrollTop(150, 600, 300, 1200, 400), 400);

  const metrics = computeNoteMetrics('One two three four five');
  assert.equal(metrics.words, 5);
  assert.equal(metrics.readingTimeMin, 1);

  const snippet = extractPlainTextSnippet('# Header\n\nClean **markdown** snippet');
  assert.equal(snippet, 'Clean markdown snippet');

  assert.equal(formatPdfFilename('Báo cáo Tuần 1!'), 'bao-cao-tuan-1.pdf');
  const html = buildPrintableNoteHtml(mockNotes[0], getTagMetadata('indigo').label);
  assert.ok(html.includes('Architecture Blueprint'));
  assert.ok(html.includes('VibeNotes · Engineering'));
});

test('[Unit] KEYBOARD_SHORTCUTS, cycleEditorViewMode, and resolveGlobalShortcutAction handle shortcut mappings', () => {
  assert.ok(KEYBOARD_SHORTCUTS.some((s) => s.id === 'new-note' && s.keys === 'Cmd/Ctrl + N'));
  assert.ok(KEYBOARD_SHORTCUTS.some((s) => s.id === 'switch-view' && s.keys === 'Cmd/Ctrl + E'));
  assert.ok(KEYBOARD_SHORTCUTS.some((s) => s.id === 'pin-note' && s.keys === 'Cmd/Ctrl + P'));

  assert.equal(cycleEditorViewMode('edit'), 'split');
  assert.equal(cycleEditorViewMode('split'), 'preview');
  assert.equal(cycleEditorViewMode('preview'), 'edit');

  assert.equal(resolveGlobalShortcutAction({ key: 'n', ctrlKey: true }), 'new-note');
  assert.equal(resolveGlobalShortcutAction({ key: 'E', metaKey: true }), 'cycle-view');
  assert.equal(resolveGlobalShortcutAction({ key: 'p', ctrlKey: true }), 'toggle-pin');
  assert.equal(resolveGlobalShortcutAction({ key: 'k', metaKey: true }), 'focus-search');
  assert.equal(resolveGlobalShortcutAction({ key: '/', ctrlKey: true }), 'toggle-shortcuts-modal');
  assert.equal(
    resolveGlobalShortcutAction({ key: '?', isEditableTarget: false }),
    'toggle-shortcuts-modal'
  );
  assert.equal(
    resolveGlobalShortcutAction({ key: '?', isEditableTarget: true }),
    null
  );
});

