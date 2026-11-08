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
  NOTE_SORT_OPTIONS,
  sortNotesByOption,
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
  MAX_NOTE_VERSIONS,
  NoteVersionHistoryMap,
  getNoteVersionStack,
  recordNoteVersionSnapshot,
  restorePreviousNoteVersion,
  deriveUserNameFromEmail,
  validateEmailLoginInput,
  validateEmailSignUpInput,
  createGoogleDemoUserProfile,
  SAVE_TOAST_DEBOUNCE_MS,
  SAVE_TOAST_VISIBLE_MS,
  createInitialSaveToastState,
  transitionSaveToastOnEdit,
  transitionSaveToastOnDebounceComplete,
  transitionSaveToastOnReset,
  AccountNotesMap,
  DEMO_WORKSPACE_EMAIL,
  mergeDefaultRegisteredAccounts,
  normalizeAccountStorageKey,
  getNotesForAccount,
  initializeAccountNotesOnAuth,
  exportNotesToKeepJson,
  parseImportedKeepJson,
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

test('[Unit] filterAndSortNotes and sortNotesByOption support Pinned, Date Modified, and Title sort modes and search title/content/filter', () => {
  // Verify NOTE_SORT_OPTIONS exposes Date Modified, Title, and Pinned
  assert.deepEqual(
    NOTE_SORT_OPTIONS.map((o) => o.label),
    ['Date Modified', 'Title', 'Pinned']
  );

  // 1. Default / 'pinned' sort: pinned first (note-2), then updatedAt descending (note-3 -> note-1)
  const allSortedPinned = filterAndSortNotes(mockNotes, '', 'all', TAG_CATEGORIES, 'pinned');
  assert.deepEqual(
    allSortedPinned.map((n) => n.id),
    ['note-2', 'note-3', 'note-1']
  );

  // 2. 'dateModified' sort: strictly newest updatedAt first regardless of pinned status (note-3 Oct 15 -> note-1 Oct 1 -> note-2 Sep 20)
  const allSortedByDate = filterAndSortNotes(
    mockNotes,
    '',
    'all',
    TAG_CATEGORIES,
    'dateModified'
  );
  assert.deepEqual(
    allSortedByDate.map((n) => n.id),
    ['note-3', 'note-1', 'note-2']
  );

  // 3. 'title' sort: alphabetical A-Z by title ('Architecture Blueprint' -> 'Research Paper Summary' -> 'Sprint Retrospective')
  const allSortedByTitle = filterAndSortNotes(
    mockNotes,
    '',
    'all',
    TAG_CATEGORIES,
    'title'
  );
  assert.deepEqual(
    allSortedByTitle.map((n) => n.id),
    ['note-1', 'note-3', 'note-2']
  );
  assert.deepEqual(
    sortNotesByOption(mockNotes, 'title').map((n) => n.title),
    ['Architecture Blueprint', 'Research Paper Summary', 'Sprint Retrospective']
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

  // Verify Keep JSON Snapshot export & import roundtrip
  const exportedJson = exportNotesToKeepJson(mockNotes);
  const importedRes = parseImportedKeepJson(exportedJson);
  assert.equal(importedRes.ok, true);
  assert.equal(importedRes.notes.length, 3);
  assert.equal(importedRes.notes[0].title, 'Architecture Blueprint');
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

test('[Unit] Local note version history stack records snapshots and restores previous versions up to MAX_NOTE_VERSIONS', () => {
  let historyMap: NoteVersionHistoryMap = {};
  const baseNote = {
    id: 'note-ver-1',
    title: 'Draft v1',
    content: 'Content v1',
  };

  // Recording with identical content should be a no-op
  historyMap = recordNoteVersionSnapshot(historyMap, baseNote, {
    content: 'Content v1',
  });
  assert.equal(getNoteVersionStack(historyMap, 'note-ver-1').length, 0);

  // Recording when content changes to v2 pushes v1 onto the stack
  historyMap = recordNoteVersionSnapshot(historyMap, baseNote, {
    content: 'Content v2',
  });
  assert.equal(getNoteVersionStack(historyMap, 'note-ver-1').length, 1);
  assert.equal(getNoteVersionStack(historyMap, 'note-ver-1')[0].content, 'Content v1');

  // Recording when content changes from v2 to v3 pushes v2 onto the stack
  historyMap = recordNoteVersionSnapshot(
    historyMap,
    { ...baseNote, content: 'Content v2' },
    { content: 'Content v3' }
  );
  assert.equal(getNoteVersionStack(historyMap, 'note-ver-1').length, 2);

  // Restoring pops the most recent version (v2) first, then v1
  const restore1 = restorePreviousNoteVersion(historyMap, 'note-ver-1');
  assert.equal(restore1.restoredSnapshot?.content, 'Content v2');
  assert.equal(
    getNoteVersionStack(restore1.updatedHistoryMap, 'note-ver-1').length,
    1
  );

  const restore2 = restorePreviousNoteVersion(
    restore1.updatedHistoryMap,
    'note-ver-1'
  );
  assert.equal(restore2.restoredSnapshot?.content, 'Content v1');
  assert.equal(
    getNoteVersionStack(restore2.updatedHistoryMap, 'note-ver-1').length,
    0
  );
  assert.equal(MAX_NOTE_VERSIONS, 10);
});

test('[Unit] View-level Sign In and Sign Up (New User) validation handle email, registered accounts, and Google accounts', () => {
  assert.equal(deriveUserNameFromEmail('hoang.nguyen_106@gmail.com'), 'Hoang Nguyen 106');
  assert.equal(deriveUserNameFromEmail(''), 'Guest Writer');

  const emptyEmail = validateEmailLoginInput('', '1234');
  assert.equal(emptyEmail.ok, false);
  assert.ok(emptyEmail.error?.includes('email'));

  const invalidEmail = validateEmailLoginInput('invalid-email', '1234');
  assert.equal(invalidEmail.ok, false);

  const shortPass = validateEmailLoginInput('hoang@example.com', '12');
  assert.equal(shortPass.ok, false);
  assert.ok(shortPass.error?.includes('4 characters'));

  const validLogin = validateEmailLoginInput('hoang.nguyen@example.com', 'secret123');
  assert.equal(validLogin.ok, true);
  assert.equal(validLogin.profile?.name, 'Hoang Nguyen');
  assert.equal(validLogin.profile?.provider, 'email');

  // Sign Up (New User) validation
  const missingName = validateEmailSignUpInput('', 'new@vibenotes.io', 'pass123', 'pass123');
  assert.equal(missingName.ok, false);
  assert.ok(missingName.error?.includes('full name'));

  const mismatchPass = validateEmailSignUpInput(
    'Alex Rivera',
    'alex@vibenotes.io',
    'pass123',
    'different123'
  );
  assert.equal(mismatchPass.ok, false);
  assert.ok(mismatchPass.error?.includes('do not match'));

  const validSignUp = validateEmailSignUpInput(
    'Alex Rivera',
    'alex@vibenotes.io',
    'pass123',
    'pass123',
    []
  );
  assert.equal(validSignUp.ok, true);
  assert.equal(validSignUp.profile?.name, 'Alex Rivera');
  assert.equal(validSignUp.profile?.isNewUser, true);
  assert.equal(validSignUp.updatedAccounts.length, 1);

  // Duplicate email Sign Up should be rejected
  const duplicateSignUp = validateEmailSignUpInput(
    'Alex Clone',
    'ALEX@vibenotes.io',
    'pass123',
    'pass123',
    validSignUp.updatedAccounts
  );
  assert.equal(duplicateSignUp.ok, false);
  assert.ok(duplicateSignUp.error?.includes('already exists'));

  // Unregistered email Sign In when registeredAccounts is non-empty should be rejected
  const unregisteredLogin = validateEmailLoginInput(
    'unknown@vibenotes.io',
    'pass123',
    '',
    validSignUp.updatedAccounts
  );
  assert.equal(unregisteredLogin.ok, false);
  assert.ok(unregisteredLogin.error?.includes('No account found'));

  // Sign In with registered account: wrong password fails, right password resolves saved full name
  const wrongPassLogin = validateEmailLoginInput(
    'alex@vibenotes.io',
    'wrong999',
    '',
    validSignUp.updatedAccounts
  );
  assert.equal(wrongPassLogin.ok, false);
  assert.ok(wrongPassLogin.error?.includes('Incorrect password'));

  const registeredLogin = validateEmailLoginInput(
    'alex@vibenotes.io',
    'pass123',
    '',
    validSignUp.updatedAccounts
  );
  assert.equal(registeredLogin.ok, true);
  assert.equal(registeredLogin.profile?.name, 'Alex Rivera');

  const googleProfile = createGoogleDemoUserProfile();
  assert.equal(googleProfile.provider, 'google');
  assert.equal(googleProfile.name, 'Hoang Nguyen');
});

test('[Unit] 2-second debounced Editor Saved toast state machine transitions accurately across typing, 2000ms idle, and note switch', () => {
  assert.equal(SAVE_TOAST_DEBOUNCE_MS, 2000);
  assert.ok(SAVE_TOAST_VISIBLE_MS >= 2000);

  let toastState = createInitialSaveToastState();
  assert.equal(toastState.status, 'idle');
  assert.equal(toastState.noteId, null);

  // User starts typing in 'note-1' -> immediately enters 'typing' state (hides any visible toast)
  toastState = transitionSaveToastOnEdit('note-1');
  assert.equal(toastState.status, 'typing');
  assert.equal(toastState.noteId, 'note-1');
  assert.equal(toastState.savedAt, null);

  // If debounce completes while a different note ('note-2') is active, it should NOT show 'saved'
  const mismatched = transitionSaveToastOnDebounceComplete(toastState, 'note-2');
  assert.equal(mismatched.status, 'typing');

  // After 2 seconds of inactivity on 'note-1', debounce completes -> transitions to 'saved'
  const savedTimestamp = '2026-11-04T11:20:00.000Z';
  toastState = transitionSaveToastOnDebounceComplete(
    toastState,
    'note-1',
    savedTimestamp
  );
  assert.equal(toastState.status, 'saved');
  assert.equal(toastState.noteId, 'note-1');
  assert.equal(toastState.savedAt, savedTimestamp);

  // If user types again while 'Saved' toast is visible, it immediately returns to 'typing'
  toastState = transitionSaveToastOnEdit('note-1');
  assert.equal(toastState.status, 'typing');

  // Resetting (on auto-hide or note switch) returns to 'idle'
  toastState = transitionSaveToastOnReset();
  assert.equal(toastState.status, 'idle');
  assert.equal(toastState.noteId, null);
});

test('[Unit] Per-account note storage ensures any new account starts with 0 notes and isolates notes per account', () => {
  assert.equal(normalizeAccountStorageKey('  NewUser@VibeNotes.io  '), 'newuser@vibenotes.io');
  assert.equal(normalizeAccountStorageKey(''), 'anonymous');

  let accountNotesMap: AccountNotesMap = {};

  // 1. Brand-new Sign Up account starts with 0 notes ([])
  const newSignUpProfile = {
    email: 'newuser@vibenotes.io',
    isNewUser: true,
  };
  const initNewRes = initializeAccountNotesOnAuth(accountNotesMap, newSignUpProfile);
  accountNotesMap = initNewRes.updatedAccountNotesMap;
  assert.deepEqual(initNewRes.accountNotes, []);
  assert.deepEqual(getNotesForAccount(accountNotesMap, newSignUpProfile), []);

  // 2. User creates a note inside 'newuser@vibenotes.io'
  const createdNote = createNewNoteItem({
    id: 'user-1-note',
    title: 'My First Personal Note',
  });
  accountNotesMap = {
    ...accountNotesMap,
    [normalizeAccountStorageKey(newSignUpProfile.email)]: [createdNote],
  };
  assert.equal(getNotesForAccount(accountNotesMap, newSignUpProfile).length, 1);

  // 3. Another new account ('second@vibenotes.io') logs in -> has 0 notes ([]), completely isolated from first user
  const secondProfile = {
    email: 'second@vibenotes.io',
    isNewUser: false,
  };
  const initSecondRes = initializeAccountNotesOnAuth(accountNotesMap, secondProfile);
  accountNotesMap = initSecondRes.updatedAccountNotesMap;
  assert.deepEqual(initSecondRes.accountNotes, []);
  assert.equal(getNotesForAccount(accountNotesMap, secondProfile).length, 0);

  // 4. First user signs back in (isNewUser: false) -> retains their 1 created note
  const returningFirstProfile = {
    email: 'newuser@vibenotes.io',
    isNewUser: false,
  };
  const returnFirstRes = initializeAccountNotesOnAuth(
    accountNotesMap,
    returningFirstProfile
  );
  assert.equal(returnFirstRes.accountNotes.length, 1);
  assert.equal(returnFirstRes.accountNotes[0].title, 'My First Personal Note');

  // 5. Evaluator demo account (demo@vibenotes.io) is pre-registered and seeded with 4 sample notes
  const mergedAccounts = mergeDefaultRegisteredAccounts([]);
  assert.ok(mergedAccounts.some((a) => a.email === DEMO_WORKSPACE_EMAIL));
  const demoLogin = validateEmailLoginInput(
    DEMO_WORKSPACE_EMAIL,
    'demo1234',
    '',
    mergedAccounts
  );
  assert.equal(demoLogin.ok, true);
  const demoNotesRes = initializeAccountNotesOnAuth(
    accountNotesMap,
    demoLogin.profile!
  );
  assert.equal(demoNotesRes.accountNotes.length, 4);
});

