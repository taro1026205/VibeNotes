import React, { useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Link2,
  Terminal,
  Undo2,
  Redo2,
  PanelLeft,
  PenLine,
  Columns2,
  Eye,
  History,
} from 'lucide-react';
import {
  NoteItem,
  NoteTag,
  TagColor,
  renderMarkdownToHtml,
  applyMarkdownInsertion,
  getMarkdownAutocompleteSuggestions,
  applyAutocompleteSuggestion,
  ActiveAutocompleteContext,
  MarkdownSuggestion,
  MARKDOWN_SNIPPETS,
  computeSyncedScrollTop,
  EditorHistoryState,
  createInitialHistoryState,
  pushEditorHistory,
  undoEditorHistory,
  redoEditorHistory,
} from '../utils/notesLogic';

export type EditorViewMode = 'edit' | 'split' | 'preview';

interface NoteWorkspaceProps {
  note: NoteItem | null;
  allFilters: NoteTag[];
  viewMode: EditorViewMode;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onViewModeChange: (mode: EditorViewMode) => void;
  onUpdateNote: (id: string, changes: Partial<NoteItem>) => void;
  onMoveNoteToFilter: (noteId: string, targetFilterId: TagColor) => void;
  onRequestDeleteNote: (note: NoteItem) => void;
  onCreateNote: () => void;
  onExportPdf: () => void;
  isExportingPdf?: boolean;
  previousVersionsCount?: number;
  onRestorePreviousVersion?: () => void;
}

export const NoteWorkspace: React.FC<NoteWorkspaceProps> = ({
  note,
  allFilters,
  viewMode,
  isSidebarOpen = true,
  onToggleSidebar,
  onViewModeChange,
  onUpdateNote,
  onMoveNoteToFilter,
  onRequestDeleteNote,
  onCreateNote,
  onExportPdf,
  isExportingPdf = false,
  previousVersionsCount = 0,
  onRestorePreviousVersion,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const activeScrollSourceRef = useRef<'editor' | 'preview' | null>(null);
  const scrollReleaseTimerRef = useRef<number | null>(null);
  const scrollRafRef = useRef<number | null>(null);

  const [selectionLength, setSelectionLength] = useState(0);
  const [autocompleteCtx, setAutocompleteCtx] =
    useState<ActiveAutocompleteContext | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [historyByNoteId, setHistoryByNoteId] = useState<
    Record<string, EditorHistoryState>
  >({});

  const releaseScrollLockLater = () => {
    if (scrollReleaseTimerRef.current !== null) {
      window.clearTimeout(scrollReleaseTimerRef.current);
    }
    scrollReleaseTimerRef.current = window.setTimeout(() => {
      activeScrollSourceRef.current = null;
      scrollReleaseTimerRef.current = null;
    }, 60);
  };

  const handleEditorScroll = () => {
    if (viewMode !== 'split') return;
    if (activeScrollSourceRef.current === 'preview') return;

    const editorEl = textareaRef.current;
    const previewEl = previewScrollRef.current;
    if (!editorEl || !previewEl) return;

    activeScrollSourceRef.current = 'editor';
    const nextScrollTop = computeSyncedScrollTop(
      editorEl.scrollTop,
      editorEl.scrollHeight,
      editorEl.clientHeight,
      previewEl.scrollHeight,
      previewEl.clientHeight
    );

    if (scrollRafRef.current !== null) {
      cancelAnimationFrame(scrollRafRef.current);
    }
    previewEl.scrollTop = nextScrollTop;
    releaseScrollLockLater();
  };

  const handlePreviewScroll = () => {
    if (viewMode !== 'split') return;
    if (activeScrollSourceRef.current === 'editor') return;

    const editorEl = textareaRef.current;
    const previewEl = previewScrollRef.current;
    if (!editorEl || !previewEl) return;

    activeScrollSourceRef.current = 'preview';
    const nextScrollTop = computeSyncedScrollTop(
      previewEl.scrollTop,
      previewEl.scrollHeight,
      previewEl.clientHeight,
      editorEl.scrollHeight,
      editorEl.clientHeight
    );

    if (scrollRafRef.current !== null) {
      cancelAnimationFrame(scrollRafRef.current);
    }
    editorEl.scrollTop = nextScrollTop;
    releaseScrollLockLater();
  };

  if (!note) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-[var(--surface)]">
        <div className="max-w-sm space-y-4">
          <h2 className="text-3xl font-semibold text-[var(--ink)] font-display">
            No Note Selected
          </h2>
          <p className="text-sm text-[var(--ink-medium)] leading-relaxed">
            Choose a note from the index or create a new Markdown document to begin writing.
          </p>
          <div className="flex items-center justify-center gap-3">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="px-3 py-2 border border-[var(--ink)] text-xs font-mono uppercase tracking-wider text-[var(--ink)] cursor-pointer"
              >
                Open Notes List
              </button>
            )}
            <button
              type="button"
              onClick={onCreateNote}
              className="btn-editorial-primary"
            >
              + New Note
            </button>
          </div>
        </div>
      </main>
    );
  }

  const renderedHtml = renderMarkdownToHtml(note.content);

  const currentHistory =
    historyByNoteId[note.id] || createInitialHistoryState(note.content);
  const canUndo = currentHistory.past.length > 0;
  const canRedo = currentHistory.future.length > 0;

  const recordContentChange = (
    nextContent: string,
    nextSelectionStart: number,
    nextSelectionEnd: number
  ) => {
    setHistoryByNoteId((prev) => {
      const existing =
        prev[note.id] ||
        createInitialHistoryState(
          note.content,
          textareaRef.current?.selectionStart ?? note.content.length,
          textareaRef.current?.selectionEnd ?? note.content.length
        );
      return {
        ...prev,
        [note.id]: pushEditorHistory(existing, {
          content: nextContent,
          selectionStart: nextSelectionStart,
          selectionEnd: nextSelectionEnd,
        }),
      };
    });
    onUpdateNote(note.id, { content: nextContent });
  };

  const handleUndo = () => {
    const existing =
      historyByNoteId[note.id] || createInitialHistoryState(note.content);
    const { nextState, restored } = undoEditorHistory(existing);
    if (!restored) return;

    setHistoryByNoteId((prev) => ({
      ...prev,
      [note.id]: nextState,
    }));
    onUpdateNote(note.id, { content: restored.content });
    setAutocompleteCtx(null);

    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(restored.selectionStart, restored.selectionEnd);
        setSelectionLength(
          Math.max(0, restored.selectionEnd - restored.selectionStart)
        );
      }
    });
  };

  const handleRedo = () => {
    const existing =
      historyByNoteId[note.id] || createInitialHistoryState(note.content);
    const { nextState, restored } = redoEditorHistory(existing);
    if (!restored) return;

    setHistoryByNoteId((prev) => ({
      ...prev,
      [note.id]: nextState,
    }));
    onUpdateNote(note.id, { content: restored.content });
    setAutocompleteCtx(null);

    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(restored.selectionStart, restored.selectionEnd);
        setSelectionLength(
          Math.max(0, restored.selectionEnd - restored.selectionStart)
        );
      }
    });
  };

  const insertMarkdownSyntax = (prefix: string, suffix = '', defaultText = 'text') => {
    const el = textareaRef.current;
    if (!el) {
      const nextContent = `${note.content}\n${prefix}${defaultText}${suffix}`;
      recordContentChange(nextContent, nextContent.length, nextContent.length);
      return;
    }

    const { updatedContent, nextSelectionStart, nextSelectionEnd } = applyMarkdownInsertion(
      note.content,
      el.selectionStart,
      el.selectionEnd,
      prefix,
      suffix,
      defaultText
    );

    recordContentChange(updatedContent, nextSelectionStart, nextSelectionEnd);
    setAutocompleteCtx(null);

    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(nextSelectionStart, nextSelectionEnd);
      setSelectionLength(nextSelectionEnd - nextSelectionStart);
    });
  };

  const handleSelectSuggestion = (suggestion: MarkdownSuggestion) => {
    if (!autocompleteCtx) return;
    const el = textareaRef.current;

    const { updatedContent, nextCursorPosition } = applyAutocompleteSuggestion(
      note.content,
      autocompleteCtx,
      suggestion
    );

    recordContentChange(updatedContent, nextCursorPosition, nextCursorPosition);
    setAutocompleteCtx(null);
    setSelectedSuggestionIndex(0);

    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(nextCursorPosition, nextCursorPosition);
      }
    });
  };

  const triggerManualSuggestions = () => {
    const el = textareaRef.current;
    const cursorPos = el ? el.selectionStart : note.content.length;
    setAutocompleteCtx({
      triggerStart: cursorPos,
      triggerEnd: cursorPos,
      query: '/',
      suggestions: MARKDOWN_SNIPPETS.slice(0, 6),
    });
    setSelectedSuggestionIndex(0);
    requestAnimationFrame(() => {
      el?.focus();
    });
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    recordContentChange(nextValue, cursorPos, e.target.selectionEnd);

    const nextCtx = getMarkdownAutocompleteSuggestions(nextValue, cursorPos);
    setAutocompleteCtx(nextCtx);
    setSelectedSuggestionIndex(0);
  };

  const handleTextareaSelect = () => {
    const el = textareaRef.current;
    if (!el) return;
    setSelectionLength(Math.max(0, el.selectionEnd - el.selectionStart));
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (autocompleteCtx && autocompleteCtx.suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(
          (prev) => (prev + 1) % autocompleteCtx.suggestions.length
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(
          (prev) =>
            (prev - 1 + autocompleteCtx.suggestions.length) %
            autocompleteCtx.suggestions.length
        );
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        const chosen =
          autocompleteCtx.suggestions[selectedSuggestionIndex] ||
          autocompleteCtx.suggestions[0];
        if (chosen) {
          handleSelectSuggestion(chosen);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setAutocompleteCtx(null);
        return;
      }
    }

    if (e.metaKey || e.ctrlKey) {
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (key === 'b') {
        e.preventDefault();
        insertMarkdownSyntax('**', '**', 'bold text');
      } else if (key === 'i') {
        e.preventDefault();
        insertMarkdownSyntax('*', '*', 'italic text');
      } else if (key === ' ') {
        e.preventDefault();
        triggerManualSuggestions();
      }
    }
  };

  const modeConfig: { id: EditorViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'edit', label: 'edit', icon: <PenLine className="w-3 h-3" /> },
    { id: 'split', label: 'split', icon: <Columns2 className="w-3 h-3" /> },
    { id: 'preview', label: 'preview', icon: <Eye className="w-3 h-3" /> },
  ];

  return (
    <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden bg-[var(--surface)]">
      {/* Top Workspace Control Bar (Notion-style breadcrumb + Segmented View Modes + Actions) */}
      <div className="px-4 sm:px-8 py-2.5 sm:py-3 border-b border-[var(--ink-faint)] flex flex-wrap items-center justify-between gap-2 sm:gap-4 shrink-0 bg-[var(--bg)]/50">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Notion-style Sidebar Drawer Toggle Button */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle notes sidebar"
              title={isSidebarOpen ? 'Hide sidebar' : 'Show notes sidebar'}
              className={`inline-flex items-center gap-1.5 px-2 py-1 border text-[0.6rem] font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                !isSidebarOpen
                  ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]'
                  : 'border-[var(--ink-faint)] text-[var(--ink)] hover:border-[var(--ink)] lg:hidden'
              }`}
            >
              <PanelLeft className="w-3.5 h-3.5" />
              <span>Notes</span>
            </button>
          )}

          <div className="inline-flex items-center">
            <label htmlFor="note-category-select" className="sr-only">
              Select filter
            </label>
            <select
              id="note-category-select"
              value={note.tag}
              onChange={(e) => onMoveNoteToFilter(note.id, e.target.value as TagColor)}
              aria-label="Select note filter"
              className="editorial-label bg-transparent border border-[var(--ink-faint)] hover:border-[var(--ink)] px-2 py-1 text-[var(--ink)] focus:outline-none focus:border-[var(--ink)] cursor-pointer"
            >
              {allFilters.length === 0 && (
                <option value="" className="bg-[var(--surface)] text-[var(--ink)]">
                  All
                </option>
              )}
              {allFilters.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[var(--surface)] text-[var(--ink)]">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <span className="hidden 2xl:inline editorial-label opacity-25" aria-hidden="true">
            |
          </span>

          <span className="hidden 2xl:inline editorial-label truncate">
            Type / or #, -, &gt; for syntax suggestions
            {selectionLength > 0 ? ` · ${selectionLength} chars selected` : ''}
          </span>
        </div>

        {/* Right Side: Tactile Segmented View Mode Switcher + Export PDF + Pin + Delete */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <div
            className="inline-flex items-center p-0.5 bg-[var(--bg)] border border-[var(--ink-faint)]"
            role="group"
            aria-label="Editor view mode"
          >
            {modeConfig.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onViewModeChange(m.id)}
                className={`inline-flex items-center gap-1 text-[0.6rem] font-mono uppercase tracking-wider px-2 sm:px-2.5 py-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  viewMode === m.id
                    ? 'bg-[var(--ink)] text-[var(--bg)] font-bold shadow-xs'
                    : 'text-[var(--ink-medium)] hover:text-[var(--ink)]'
                }`}
              >
                {m.icon}
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onRestorePreviousVersion}
            disabled={previousVersionsCount === 0}
            aria-label="Restore previous version"
            title={
              previousVersionsCount > 0
                ? `Restore previous version (${previousVersionsCount} saved in localStorage)`
                : 'No previous versions saved for this note yet'
            }
            className="inline-flex items-center gap-1 text-[0.6rem] font-mono uppercase tracking-wider border border-[var(--ink-faint)] hover:border-[var(--ink)] text-[var(--ink)] px-2 py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-40 disabled:pointer-events-none"
          >
            <History className="w-3 h-3" />
            <span>
              Restore previous version
              {previousVersionsCount > 0 ? ` (${previousVersionsCount})` : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={onExportPdf}
            disabled={isExportingPdf}
            aria-label="Export active note as PDF"
            className="text-[0.6rem] font-mono uppercase tracking-wider border border-[var(--ink-faint)] hover:border-[var(--ink)] text-[var(--ink)] px-2 py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {isExportingPdf ? 'Exporting...' : 'Export PDF'}
          </button>

          <button
            type="button"
            onClick={() => onUpdateNote(note.id, { pinned: !note.pinned })}
            aria-label={note.pinned ? 'Unpin active note' : 'Pin active note'}
            className={`text-[0.6rem] font-mono uppercase tracking-wider border px-2 py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              note.pinned
                ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]'
                : 'border-[var(--ink-faint)] text-[var(--ink)] hover:border-[var(--ink)]'
            }`}
          >
            {note.pinned ? 'Pinned' : 'Pin'}
          </button>

          <button
            type="button"
            onClick={() => onRequestDeleteNote(note)}
            aria-label="Delete active note"
            className="text-[0.6rem] font-mono uppercase tracking-wider border border-[#ff4444] text-[#ff4444] hover:bg-[#ff4444] hover:text-white px-2 py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Editorial Display Title (Responsive Padding & Typography on Mobile/Tablet/Desktop) */}
      <div className="px-4 sm:px-8 lg:px-12 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-[var(--ink-faint)] shrink-0">
        <input
          type="text"
          value={note.title}
          onChange={(e) => onUpdateNote(note.id, { title: e.target.value })}
          placeholder="Note Title..."
          aria-label="Note title"
          className="w-full text-2xl sm:text-3xl lg:text-[2.6rem] leading-tight font-semibold tracking-tight bg-transparent text-[var(--ink)] placeholder:text-[var(--ink-medium)]/40 focus:outline-none font-display"
        />
      </div>

      {/* Editor & Live Markdown Preview Container:
          - Mobile (<768px) in Split Mode: 2 equal vertical rows (grid-rows-2) so both scroll smoothly
          - Tablet & Desktop (>=768px) in Split Mode: 2 equal side-by-side columns (md:grid-cols-12) */}
      <div
        className={`flex-1 min-h-0 grid overflow-hidden ${
          viewMode === 'split'
            ? 'grid-cols-1 grid-rows-2 md:grid-rows-1 md:grid-cols-12'
            : 'grid-cols-1 grid-rows-1 md:grid-cols-12'
        }`}
      >
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={`relative h-full min-h-0 flex flex-col overflow-hidden bg-[var(--bg)] ${
              viewMode === 'split'
                ? 'md:col-span-6 border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-[var(--ink-faint)]'
                : 'md:col-span-12'
            }`}
          >
            {/* Single-Row Horizontally Swipeable Floating Toolbar (Notion / Bear Touch Style) */}
            <div className="px-4 sm:px-8 lg:px-12 pt-3 pb-2 z-20 flex flex-col gap-2 shrink-0">
              <div className="w-full overflow-x-auto no-scrollbar smooth-touch-scroll pb-0.5">
                <div
                  role="toolbar"
                  aria-label="Floating Markdown formatting toolbar"
                  data-testid="floating-markdown-toolbar"
                  className="inline-flex items-center gap-0.5 px-2 py-1.5 bg-[var(--surface)] border-[1.5px] border-[var(--ink)] shadow-[2px_2px_0px_var(--ink)] sm:shadow-[3px_3px_0px_var(--ink)] min-w-max"
                >
                  {/* Undo & Redo Group */}
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={!canUndo}
                    aria-label="Undo"
                    title="Undo (⌘Z / Ctrl+Z)"
                    className="inline-flex items-center gap-1 px-2 py-1 text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)] disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Undo</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={!canRedo}
                    aria-label="Redo"
                    title="Redo (⌘⇧Z / Ctrl+Y)"
                    className="inline-flex items-center gap-1 px-2 py-1 text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)] disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                    <span>Redo</span>
                  </button>

                  <span className="h-4 w-px bg-[var(--ink-faint)] mx-1" aria-hidden="true" />

                  {/* Headers Group */}
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('# ', '', 'Heading 1')}
                    aria-label="Insert Heading 1"
                    title="Heading 1 (# )"
                    className="inline-flex items-center gap-1 px-2 py-1 text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Heading1 className="w-3.5 h-3.5" />
                    <span>H1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('## ', '', 'Heading 2')}
                    aria-label="Insert Heading 2"
                    title="Heading 2 (## )"
                    className="inline-flex items-center gap-1 px-2 py-1 text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                    <span>H2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('### ', '', 'Heading 3')}
                    aria-label="Insert Heading 3"
                    title="Heading 3 (### )"
                    className="inline-flex items-center gap-1 px-2 py-1 text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Heading3 className="w-3.5 h-3.5" />
                    <span>H3</span>
                  </button>

                  <span className="h-4 w-px bg-[var(--ink-faint)] mx-1" aria-hidden="true" />

                  {/* Inline Styles Group */}
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('**', '**', 'bold text')}
                    aria-label="Insert Bold"
                    title="Bold (⌘B)"
                    className="inline-flex items-center gap-1 px-2 py-1 text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Bold className="w-3.5 h-3.5" />
                    <span>Bold</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('*', '*', 'italic text')}
                    aria-label="Insert Italic"
                    title="Italic (⌘I)"
                    className="inline-flex items-center gap-1 px-2 py-1 text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Italic className="w-3.5 h-3.5" />
                    <span>Italic</span>
                  </button>

                  <span className="h-4 w-px bg-[var(--ink-faint)] mx-1" aria-hidden="true" />

                  {/* Lists Group */}
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('\n- ', '', 'List item')}
                    aria-label="Insert Bullet List"
                    title="Bullet List (- )"
                    className="inline-flex items-center gap-1 px-2 py-1 text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>List</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('\n1. ', '', 'Numbered item')}
                    aria-label="Insert Numbered List"
                    title="Numbered List (1. )"
                    className="inline-flex items-center gap-1 px-2 py-1 text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>Num</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('\n- [ ] ', '', 'Task item')}
                    aria-label="Insert Checklist"
                    title="Task Checklist (- [ ] )"
                    className="inline-flex items-center gap-1 px-2 py-1 text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Task</span>
                  </button>

                  <span className="h-4 w-px bg-[var(--ink-faint)] mx-1" aria-hidden="true" />

                  {/* Blocks & Links Group */}
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('\n> ', '', 'Blockquote')}
                    aria-label="Insert Blockquote"
                    title="Blockquote (> )"
                    className="inline-flex items-center gap-1 px-2 py-1 text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Quote className="w-3.5 h-3.5" />
                    <span>Quote</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('`', '`', 'code')}
                    aria-label="Insert Inline Code"
                    title="Inline Code (`code`)"
                    className="inline-flex items-center gap-1 px-2 py-1 text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('[', '](https://example.com)', 'link text')}
                    aria-label="Insert Link"
                    title="Markdown Link ([text](url))"
                    className="inline-flex items-center gap-1 px-2 py-1 text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Link</span>
                  </button>

                  <span className="h-4 w-px bg-[var(--ink-faint)] mx-1" aria-hidden="true" />

                  {/* Auto-Complete Palette Trigger */}
                  <button
                    type="button"
                    onClick={triggerManualSuggestions}
                    aria-label="Open Markdown auto-complete suggestions"
                    title="Open Markdown Auto-Complete (/)"
                    className="inline-flex items-center gap-1 px-2 py-1 text-[0.65rem] font-mono font-bold uppercase tracking-wider bg-[var(--ink)] text-[var(--bg)] hover:opacity-85 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Suggest (/)</span>
                  </button>
                </div>
              </div>

              {/* Contextual Auto-Completion Popover */}
              {autocompleteCtx && autocompleteCtx.suggestions.length > 0 && (
                <div
                  role="listbox"
                  aria-label="Markdown syntax suggestions"
                  data-testid="markdown-autocomplete-menu"
                  className="w-full max-w-md bg-[var(--surface)] border-[1.5px] border-[var(--ink)] shadow-[4px_4px_0px_var(--ink)] divide-y divide-[var(--ink-faint)]"
                >
                  <div className="px-3 py-1.5 bg-[var(--bg)] flex items-center justify-between">
                    <span className="editorial-label !text-[0.58rem]">
                      Auto-Complete ({autocompleteCtx.query})
                    </span>
                    <span className="editorial-label !text-[0.58rem]">
                      ↑↓ · Enter · Esc
                    </span>
                  </div>
                  <div className="max-h-44 overflow-y-auto smooth-touch-scroll">
                    {autocompleteCtx.suggestions.map((suggestion, idx) => {
                      const isSelected = idx === selectedSuggestionIndex;
                      return (
                        <button
                          key={suggestion.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className={`w-full px-3 py-2 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--ink)] text-[var(--bg)]'
                              : 'bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--bg)]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <code
                              className={`px-1.5 py-0.5 text-[0.65rem] font-mono border shrink-0 ${
                                isSelected
                                  ? 'border-[var(--bg)]/40 text-[var(--bg)]'
                                  : 'border-[var(--ink-faint)] text-[var(--ink)] bg-[var(--bg)]'
                              }`}
                            >
                              {suggestion.syntax}
                            </code>
                            <span className="text-xs font-semibold truncate">
                              {suggestion.label}
                            </span>
                          </div>
                          <span
                            className={`text-[0.65rem] font-mono truncate ${
                              isSelected ? 'text-[var(--bg)]/80' : 'text-[var(--ink-medium)]'
                            }`}
                          >
                            {suggestion.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <textarea
              ref={textareaRef}
              spellCheck={false}
              value={note.content}
              onScroll={handleEditorScroll}
              onSelect={handleTextareaSelect}
              onKeyDown={handleEditorKeyDown}
              onChange={handleTextareaChange}
              placeholder="Write your note in Markdown... (Type / or #, -, > for auto-completion)"
              aria-label="Note Markdown content editor"
              className="w-full flex-1 min-h-0 px-4 sm:px-8 lg:px-12 pt-2 pb-10 resize-none bg-[var(--bg)] text-[var(--ink)] text-[0.88rem] sm:text-[0.9rem] leading-[1.7] font-mono focus:outline-none overflow-y-auto smooth-touch-scroll"
            />
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            ref={previewScrollRef}
            onScroll={handlePreviewScroll}
            aria-label="Note Markdown preview container"
            data-testid="markdown-preview-scroll-container"
            className={`h-full min-h-0 overflow-y-auto smooth-touch-scroll px-4 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10 bg-[var(--surface)] ${
              viewMode === 'split' ? 'md:col-span-6' : 'md:col-span-12'
            }`}
          >
            {viewMode === 'split' && (
              <div className="md:hidden editorial-label !text-[0.55rem] mb-2 pb-1 border-b border-[var(--ink-faint)]">
                Live Preview (Synced Scroll)
              </div>
            )}
            <div
              data-testid="markdown-preview-pane"
              className="markdown-preview max-w-[68ch] text-[14.5px] sm:text-[15px]"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        )}
      </div>
    </main>
  );
};
