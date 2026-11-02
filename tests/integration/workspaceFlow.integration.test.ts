import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TAG_CATEGORIES,
  createNewNoteItem,
  createCustomFilter,
  moveNoteToFilter,
  deleteFilterFromList,
  filterAndSortNotes,
  applyMarkdownInsertion,
  getMarkdownAutocompleteSuggestions,
  applyAutocompleteSuggestion,
  createInitialHistoryState,
  pushEditorHistory,
  undoEditorHistory,
  redoEditorHistory,
  computeNoteMetrics,
  buildPrintableNoteHtml,
  formatPdfFilename,
  KEYBOARD_SHORTCUTS,
  cycleEditorViewMode,
  resolveGlobalShortcutAction,
  NoteVersionHistoryMap,
  recordNoteVersionSnapshot,
  restorePreviousNoteVersion,
  getNoteVersionStack,
} from '../../src/utils/notesLogic';

test('[Integration Flow 1] Note Authoring -> Toolbar Formatting -> Auto-Complete -> Undo/Redo -> Local Version Restore -> PDF Export HTML', () => {
  // Step 1: User creates a new note
  let note = createNewNoteItem({
    title: 'Tài liệu Kiến trúc Hệ thống',
    content: '# Kiến trúc Hệ thống\n',
    tag: 'indigo',
  });
  let history = createInitialHistoryState(note.content);
  let versionHistoryMap: NoteVersionHistoryMap = {};

  // Step 2: User inserts Bold text via Floating Toolbar (records previous version in versionHistoryMap)
  const boldRes = applyMarkdownInsertion(
    note.content,
    note.content.length,
    note.content.length,
    '**',
    '**',
    'Local-First Storage'
  );
  versionHistoryMap = recordNoteVersionSnapshot(versionHistoryMap, note, {
    content: boldRes.updatedContent,
  });
  note = { ...note, content: boldRes.updatedContent };
  history = pushEditorHistory(history, {
    content: note.content,
    selectionStart: boldRes.nextSelectionStart,
    selectionEnd: boldRes.nextSelectionEnd,
  });
  assert.ok(note.content.includes('**Local-First Storage**'));
  assert.equal(getNoteVersionStack(versionHistoryMap, note.id).length, 1);

  // Step 3: User types a slash command '/task' at the end of a new line and applies auto-completion
  const contentWithTrigger = `${note.content}\n/task`;
  const ctx = getMarkdownAutocompleteSuggestions(
    contentWithTrigger,
    contentWithTrigger.length
  );
  assert.ok(ctx, 'Autocomplete context should trigger on /task');
  const taskSnippet = ctx?.suggestions.find((s) => s.id === 'task');
  assert.ok(taskSnippet, 'Task checklist suggestion should be returned');

  if (ctx && taskSnippet) {
    const autoRes = applyAutocompleteSuggestion(contentWithTrigger, ctx, taskSnippet);
    versionHistoryMap = recordNoteVersionSnapshot(versionHistoryMap, note, {
      content: autoRes.updatedContent,
    });
    note = { ...note, content: autoRes.updatedContent };
    history = pushEditorHistory(history, {
      content: note.content,
      selectionStart: autoRes.nextCursorPosition,
      selectionEnd: autoRes.nextCursorPosition,
    });
  }
  assert.ok(note.content.includes('- [ ] '));
  assert.equal(getNoteVersionStack(versionHistoryMap, note.id).length, 2);

  // Step 4: User clicks 'Restore previous version' -> reverts from task list back to bold-only version
  const restoredVer = restorePreviousNoteVersion(versionHistoryMap, note.id);
  assert.ok(restoredVer.restoredSnapshot);
  versionHistoryMap = restoredVer.updatedHistoryMap;
  assert.equal(
    restoredVer.restoredSnapshot?.content.includes('**Local-First Storage**'),
    true
  );
  assert.equal(getNoteVersionStack(versionHistoryMap, note.id).length, 1);

  // Step 5: User triggers Undo/Redo on editor history stack
  const afterUndo = undoEditorHistory(history);
  assert.ok(afterUndo.restored);
  note = { ...note, content: afterUndo.restored!.content };
  history = afterUndo.nextState;
  assert.equal(note.content.includes('- [ ] '), false);

  const afterRedo = redoEditorHistory(history);
  assert.ok(afterRedo.restored);
  note = { ...note, content: afterRedo.restored!.content };
  history = afterRedo.nextState;
  assert.equal(note.content.includes('- [ ] '), true);

  // Step 6: Compute metrics and generate printable PDF HTML
  const metrics = computeNoteMetrics(note.content);
  assert.ok(metrics.words >= 6);
  const pdfFilename = formatPdfFilename(note.title);
  assert.equal(pdfFilename, 'tai-lieu-kien-truc-he-thong.pdf');
  const printableHtml = buildPrintableNoteHtml(note, 'Engineering');
  assert.ok(printableHtml.includes('Tài liệu Kiến trúc Hệ thống'));
  assert.ok(printableHtml.includes('<strong>Local-First Storage</strong>'));
});

test('[Integration Flow 2] Custom Filter Creation -> Note Movement -> Multi-Field Search -> Filter Deletion Reassignment', () => {
  // Step 1: Start with default filters and 2 notes
  let filters = [...TAG_CATEGORIES];
  let notes = [
    createNewNoteItem({
      title: 'Meeting Notes',
      content: 'Discuss Q4 roadmap',
      tag: 'indigo',
    }),
    createNewNoteItem({
      title: 'Release Plan',
      content: 'Deploy production build',
      tag: 'rose',
    }),
  ];

  // Step 2: User creates a new custom filter "Dự Án Mới"
  const createRes = createCustomFilter(filters, 'Dự Án Mới');
  assert.ok(createRes.createdFilter);
  filters = createRes.updatedFilters;
  const customFilterId = createRes.createdFilter!.id;

  // Step 3: User moves the first note into the new custom filter
  notes = moveNoteToFilter(notes, notes[0].id, customFilterId);
  assert.equal(notes[0].tag, customFilterId);

  // Step 4: User searches by the custom filter's Vietnamese label ("Dự Án Mới")
  const searchByFilter = filterAndSortNotes(notes, 'dự án mới', 'all', filters);
  assert.equal(searchByFilter.length, 1);
  assert.equal(searchByFilter[0].title, 'Meeting Notes');

  // Step 5: User deletes the custom filter -> note automatically reassigns to first remaining filter ('indigo')
  const deleteRes = deleteFilterFromList(filters, notes, customFilterId);
  filters = deleteRes.updatedFilters;
  notes = deleteRes.updatedNotes;
  assert.equal(filters.some((f) => f.id === customFilterId), false);
  assert.equal(notes[0].tag, 'indigo');
});

test('[Integration Flow 3] Global Keyboard Shortcuts Workflow (Cmd/Ctrl+N -> Cmd/Ctrl+E -> Cmd/Ctrl+P -> Cheat-Sheet Modal)', () => {
  let notes = [
    createNewNoteItem({
      id: 'existing-1',
      title: 'Older Note',
      pinned: false,
      updatedAt: '2026-10-01T10:00:00.000Z',
    }),
  ];
  let viewMode: 'edit' | 'split' | 'preview' = 'split';
  let isShortcutsModalOpen = false;

  // Step 1: User presses Cmd/Ctrl + N to create a new note
  const actionNew = resolveGlobalShortcutAction({ key: 'n', ctrlKey: true });
  assert.equal(actionNew, 'new-note');
  const createdNote = createNewNoteItem({
    id: 'shortcut-note-2',
    title: 'Shortcut Created Note',
    pinned: false,
    updatedAt: '2026-10-02T10:00:00.000Z',
  });
  notes = [createdNote, ...notes];
  assert.equal(notes.length, 2);

  // Step 2: User presses Cmd/Ctrl + E twice to cycle view mode (split -> preview -> edit)
  const actionView = resolveGlobalShortcutAction({ key: 'e', metaKey: true });
  assert.equal(actionView, 'cycle-view');
  viewMode = cycleEditorViewMode(viewMode);
  assert.equal(viewMode, 'preview');
  viewMode = cycleEditorViewMode(viewMode);
  assert.equal(viewMode, 'edit');

  // Step 3: User presses Cmd/Ctrl + P to pin 'existing-1' and verifies it sorts to the top
  const actionPin = resolveGlobalShortcutAction({ key: 'p', ctrlKey: true });
  assert.equal(actionPin, 'toggle-pin');
  notes = notes.map((n) =>
    n.id === 'existing-1' ? { ...n, pinned: !n.pinned } : n
  );
  const sorted = filterAndSortNotes(notes, '', 'all', TAG_CATEGORIES);
  assert.equal(sorted[0].id, 'existing-1');
  assert.equal(sorted[0].pinned, true);

  // Step 4: User presses Cmd/Ctrl + / to open the Keyboard Shortcuts Cheat-Sheet Modal
  const actionModal = resolveGlobalShortcutAction({ key: '/', metaKey: true });
  assert.equal(actionModal, 'toggle-shortcuts-modal');
  isShortcutsModalOpen = !isShortcutsModalOpen;
  assert.equal(isShortcutsModalOpen, true);
  assert.equal(KEYBOARD_SHORTCUTS.length, 10);
});

