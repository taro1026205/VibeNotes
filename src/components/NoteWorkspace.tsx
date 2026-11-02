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
  FolderInput,
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
} from '../utils/notesLogic';

export type EditorViewMode = 'edit' | 'split' | 'preview';

interface NoteWorkspaceProps {
  note: NoteItem | null;
  allFilters: NoteTag[];
  viewMode: EditorViewMode;
  onViewModeChange: (mode: EditorViewMode) => void;
  onUpdateNote: (id: string, changes: Partial<NoteItem>) => void;
  onMoveNoteToFilter: (noteId: string, targetFilterId: TagColor) => void;
  onRequestDeleteNote: (note: NoteItem) => void;
  onCreateNote: () => void;
}

export const NoteWorkspace: React.FC<NoteWorkspaceProps> = ({
  note,
  allFilters,
  viewMode,
  onViewModeChange,
  onUpdateNote,
  onMoveNoteToFilter,
  onRequestDeleteNote,
  onCreateNote,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const activeScrollSourceRef = useRef<'editor' | 'preview' | null>(null);
  const scrollReleaseTimerRef = useRef<number | null>(null);
  const [selectionLength, setSelectionLength] = useState(0);
  const [autocompleteCtx, setAutocompleteCtx] =
    useState<ActiveAutocompleteContext | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

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
    previewEl.scrollTop = computeSyncedScrollTop(
      editorEl.scrollTop,
      editorEl.scrollHeight,
      editorEl.clientHeight,
      previewEl.scrollHeight,
      previewEl.clientHeight
    );
    releaseScrollLockLater();
  };

  const handlePreviewScroll = () => {
    if (viewMode !== 'split') return;
    if (activeScrollSourceRef.current === 'editor') return;

    const editorEl = textareaRef.current;
    const previewEl = previewScrollRef.current;
    if (!editorEl || !previewEl) return;

    activeScrollSourceRef.current = 'preview';
    editorEl.scrollTop = computeSyncedScrollTop(
      previewEl.scrollTop,
      previewEl.scrollHeight,
      previewEl.clientHeight,
      editorEl.scrollHeight,
      editorEl.clientHeight
    );
    releaseScrollLockLater();
  };

  if (!note) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--surface)]">
        <div className="max-w-sm space-y-4">
          <h2 className="text-3xl font-semibold text-[var(--ink)] font-display">
            No Note Selected
          </h2>
          <p className="text-sm text-[var(--ink-medium)] leading-relaxed">
            Choose a note from the index or create a new Markdown document to begin writing.
          </p>
          <button
            type="button"
            onClick={onCreateNote}
            className="btn-editorial-primary"
          >
            + New Note
          </button>
        </div>
      </main>
    );
  }

  const renderedHtml = renderMarkdownToHtml(note.content);

  const insertMarkdownSyntax = (prefix: string, suffix = '', defaultText = 'text') => {
    const el = textareaRef.current;
    if (!el) {
      onUpdateNote(note.id, {
        content: `${note.content}\n${prefix}${defaultText}${suffix}`,
      });
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

    onUpdateNote(note.id, { content: updatedContent });
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

    onUpdateNote(note.id, { content: updatedContent });
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
    onUpdateNote(note.id, { content: nextValue });

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

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[var(--surface)]">
      {/* Top Workspace Filter & View Mode Bar */}
      <div className="px-8 py-3 border-b border-[var(--ink-faint)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
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

          <span className="editorial-label opacity-25" aria-hidden="true">
            |
          </span>

          <span className="editorial-label">
            Type / or #, -, &gt; for syntax suggestions
            {selectionLength > 0 ? ` · ${selectionLength} chars selected` : ''}
          </span>
        </div>

        {/* Right Side: View Mode Controls + Pin + Delete */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1" role="group" aria-label="Editor view mode">
            {(['edit', 'split', 'preview'] as EditorViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onViewModeChange(mode)}
                className={`text-[0.6rem] font-mono uppercase tracking-wider border px-2 py-0.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  viewMode === mode
                    ? 'bg-[var(--ink-faint)] border-[var(--ink)] text-[var(--ink)] font-bold'
                    : 'border-[var(--ink-faint)] text-[var(--ink-medium)] hover:text-[var(--ink)]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onUpdateNote(note.id, { pinned: !note.pinned })}
            aria-label={note.pinned ? 'Unpin active note' : 'Pin active note'}
            className={`text-[0.6rem] font-mono uppercase tracking-wider border px-2 py-0.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
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
            className="text-[0.6rem] font-mono uppercase tracking-wider border border-[#ff4444] text-[#ff4444] hover:bg-[#ff4444] hover:text-white px-2 py-0.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Editorial Display Title */}
      <div className="px-12 pt-7 pb-4 border-b border-[var(--ink-faint)]">
        <input
          type="text"
          value={note.title}
          onChange={(e) => onUpdateNote(note.id, { title: e.target.value })}
          placeholder="Note Title..."
          aria-label="Note title"
          className="w-full text-3xl sm:text-[2.75rem] leading-tight font-semibold tracking-tight bg-transparent text-[var(--ink)] placeholder:text-[var(--ink-medium)]/40 focus:outline-none font-display"
        />
      </div>

      {/* Editor & Live Markdown Preview Split Container */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={`relative h-full flex flex-col overflow-hidden bg-[var(--bg)] ${
              viewMode === 'split'
                ? 'lg:col-span-6 border-b lg:border-b-0 lg:border-r border-[var(--ink-faint)]'
                : 'lg:col-span-12'
            }`}
          >
            {/* Floating Quick-Insert Toolbar Above Markdown Editor */}
            <div className="px-8 pt-4 pb-2 z-20 flex flex-col gap-2 shrink-0">
              <div
                role="toolbar"
                aria-label="Floating Markdown formatting toolbar"
                data-testid="floating-markdown-toolbar"
                className="inline-flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-[var(--surface)] border-[1.5px] border-[var(--ink)] shadow-[3px_3px_0px_var(--ink)] self-start"
              >
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
                      ↑↓ Navigate · Tab/Enter Insert · Esc Close
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
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
              className="w-full flex-1 px-12 pt-4 pb-12 resize-none bg-[var(--bg)] text-[var(--ink)] text-[0.9rem] leading-[1.7] font-mono focus:outline-none overflow-y-auto"
            />
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            ref={previewScrollRef}
            onScroll={handlePreviewScroll}
            aria-label="Note Markdown preview container"
            data-testid="markdown-preview-scroll-container"
            className={`h-full overflow-y-auto p-12 bg-[var(--surface)] ${
              viewMode === 'split' ? 'lg:col-span-6' : 'lg:col-span-12'
            }`}
          >
            <div
              data-testid="markdown-preview-pane"
              className="markdown-preview max-w-[68ch] text-[15px]"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        )}
      </div>
    </main>
  );
};
