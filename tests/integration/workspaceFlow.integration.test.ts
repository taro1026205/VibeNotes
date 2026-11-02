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
} from '../../src/utils/notesLogic';

test('[Integration Flow 1] Note Authoring -> Toolbar Formatting -> Auto-Complete -> Undo/Redo -> PDF Export HTML', () => {
  // Step 1: User creates a new note
  let note = createNewNoteItem({
    title: 'Tài liệu Kiến trúc Hệ thống',
    content: '# Kiến trúc Hệ thống\n',
    tag: 'indigo',
  });
  let history = createInitialHistoryState(note.content);

  // Step 2: User inserts Bold text via Floating Toolbar
  const boldRes = applyMarkdownInsertion(
    note.content,
    note.content.length,
    note.content.length,
    '**',
    '**',
    'Local-First Storage'
  );
  note = { ...note, content: boldRes.updatedContent };
  history = pushEditorHistory(history, {
    content: note.content,
    selectionStart: boldRes.nextSelectionStart,
    selectionEnd: boldRes.nextSelectionEnd,
  });
  assert.ok(note.content.includes('**Local-First Storage**'));

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
    note = { ...note, content: autoRes.updatedContent };
    history = pushEditorHistory(history, {
      content: note.content,
      selectionStart: autoRes.nextCursorPosition,
      selectionEnd: autoRes.nextCursorPosition,
    });
  }
  assert.ok(note.content.includes('- [ ] '));

  // Step 4: User triggers Undo -> reverts the task checklist insertion
  const afterUndo = undoEditorHistory(history);
  assert.ok(afterUndo.restored);
  note = { ...note, content: afterUndo.restored!.content };
  history = afterUndo.nextState;
  assert.equal(note.content.includes('- [ ] '), false);

  // Step 5: User triggers Redo -> restores the task checklist insertion
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
