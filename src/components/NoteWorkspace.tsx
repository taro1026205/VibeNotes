import React, { useRef } from 'react';
import {
  NoteItem,
  TagColor,
  TAG_CATEGORIES,
  renderMarkdownToHtml,
} from '../utils/notesLogic';

export type EditorViewMode = 'edit' | 'split' | 'preview';

interface NoteWorkspaceProps {
  note: NoteItem | null;
  viewMode: EditorViewMode;
  onViewModeChange: (mode: EditorViewMode) => void;
  onUpdateNote: (id: string, changes: Partial<NoteItem>) => void;
  onRequestDeleteNote: (note: NoteItem) => void;
  onCreateNote: () => void;
}

export const NoteWorkspace: React.FC<NoteWorkspaceProps> = ({
  note,
  viewMode,
  onViewModeChange,
  onUpdateNote,
  onRequestDeleteNote,
  onCreateNote,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = note.content.slice(start, end) || defaultText;
    const updated =
      note.content.slice(0, start) + prefix + selected + suffix + note.content.slice(end);

    onUpdateNote(note.id, { content: updated });

    requestAnimationFrame(() => {
      el.focus();
      const newCursorPos = start + prefix.length + selected.length;
      el.setSelectionRange(start + prefix.length, newCursorPos);
    });
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[var(--surface)]">
      {/* Variation 2 Editorial Toolbar */}
      <div className="px-8 py-3 border-b border-[var(--ink-faint)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <label htmlFor="note-category-select" className="sr-only">
            Note Category
          </label>
          <select
            id="note-category-select"
            value={note.tag}
            onChange={(e) => onUpdateNote(note.id, { tag: e.target.value as TagColor })}
            aria-label="Select note category"
            className="editorial-label bg-transparent border border-[var(--ink-faint)] px-2 py-1 text-[var(--ink)] focus:outline-none focus:border-[var(--ink)] cursor-pointer"
          >
            {TAG_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-[var(--surface)] text-[var(--ink)]">
                {cat.label}
              </option>
            ))}
          </select>

          <span className="editorial-label opacity-25" aria-hidden="true">
            |
          </span>

          {/* Markdown Quick Formatting Triggers */}
          <div className="flex items-center gap-3" role="toolbar" aria-label="Markdown formatting">
            <button
              type="button"
              onClick={() => insertMarkdownSyntax('# ', '', 'Heading 1')}
              aria-label="Insert Heading 1"
              className="editorial-label hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => insertMarkdownSyntax('## ', '', 'Heading 2')}
              aria-label="Insert Heading 2"
              className="editorial-label hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertMarkdownSyntax('**', '**', 'bold text')}
              aria-label="Insert Bold"
              className="editorial-label hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => insertMarkdownSyntax('*', '*', 'italic text')}
              aria-label="Insert Italic"
              className="editorial-label hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => insertMarkdownSyntax('- ', '', 'List item')}
              aria-label="Insert Bullet List"
              className="editorial-label hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              List
            </button>
            <button
              type="button"
              onClick={() => insertMarkdownSyntax('- [ ] ', '', 'Task item')}
              aria-label="Insert Checklist"
              className="editorial-label hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              Task
            </button>
            <button
              type="button"
              onClick={() => insertMarkdownSyntax('`', '`', 'code')}
              aria-label="Insert Inline Code"
              className="editorial-label hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              Code
            </button>
            <button
              type="button"
              onClick={() => insertMarkdownSyntax('> ', '', 'Quote')}
              aria-label="Insert Blockquote"
              className="editorial-label hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              Quote
            </button>
          </div>
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
      <div className="px-12 pt-8 pb-4 border-b border-[var(--ink-faint)]">
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
            className={`h-full flex flex-col overflow-hidden ${
              viewMode === 'split'
                ? 'lg:col-span-6 border-b lg:border-b-0 lg:border-r border-[var(--ink-faint)]'
                : 'lg:col-span-12'
            }`}
          >
            <textarea
              ref={textareaRef}
              spellCheck={false}
              value={note.content}
              onChange={(e) => onUpdateNote(note.id, { content: e.target.value })}
              placeholder="Write your note in Markdown..."
              aria-label="Note Markdown content editor"
              className="w-full flex-1 p-12 resize-none bg-[var(--bg)] text-[var(--ink)] text-[0.9rem] leading-[1.7] font-mono focus:outline-none overflow-y-auto"
            />
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
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
