import React from 'react';
import { Pin, Trash2, X } from 'lucide-react';
import {
  NoteItem,
  TagColor,
  TAG_CATEGORIES,
  extractPlainTextSnippet,
  getTagMetadata,
} from '../utils/notesLogic';

interface SidebarProps {
  notes: NoteItem[];
  activeNoteId: string | null;
  searchQuery: string;
  selectedTag: TagColor | 'all';
  onSearchChange: (q: string) => void;
  onSelectTag: (tag: TagColor | 'all') => void;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onRequestDeleteNote: (note: NoteItem, e: React.MouseEvent) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  activeNoteId,
  searchQuery,
  selectedTag,
  onSearchChange,
  onSelectTag,
  onSelectNote,
  onCreateNote,
  onTogglePin,
  onRequestDeleteNote,
  searchInputRef,
}) => {
  const pinnedNotes = notes.filter((n) => n.pinned);
  const unpinnedNotes = notes.filter((n) => !n.pinned);

  const formatShortDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const renderNoteCard = (note: NoteItem) => {
    const isActive = note.id === activeNoteId;
    const tagMeta = getTagMetadata(note.tag);
    const snippet = extractPlainTextSnippet(note.content, 85);

    return (
      <div
        key={note.id}
        role="button"
        tabIndex={0}
        onClick={() => onSelectNote(note.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectNote(note.id);
          }
        }}
        aria-label={`Select note ${note.title || 'Untitled Note'}`}
        className={`group relative p-6 border-b border-[var(--ink-faint)] transition-colors cursor-pointer text-left ${
          isActive
            ? 'bg-[var(--surface)] ring-1 ring-inset ring-[var(--ink)]'
            : 'bg-transparent hover:bg-[var(--surface)]/70'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[1.05rem] font-semibold leading-snug text-[var(--ink)] font-display">
            {note.title || 'Untitled Note'}
          </h3>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => onTogglePin(note.id, e)}
              aria-label={
                note.pinned
                  ? `Unpin '${note.title || 'Untitled Note'}'`
                  : `Pin '${note.title || 'Untitled Note'}'`
              }
              className={`p-1 transition-opacity ${
                note.pinned
                  ? 'text-[var(--ink)] opacity-100'
                  : 'text-[var(--ink-medium)] opacity-0 group-hover:opacity-100 hover:text-[var(--ink)]'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => onRequestDeleteNote(note, e)}
              aria-label={`Delete '${note.title || 'Untitled Note'}'`}
              className="p-1 text-[var(--ink-medium)] opacity-0 group-hover:opacity-100 hover:text-[#ff4444] transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="mt-1.5 text-xs text-[var(--ink-medium)] line-clamp-2 leading-relaxed">
          {snippet}
        </p>

        <div className="editorial-label mt-3 flex items-center gap-1.5 !text-[0.55rem]">
          <span>{tagMeta.label}</span>
          <span aria-hidden="true">·</span>
          <span>{formatShortDate(note.updatedAt)}</span>
          {note.keepResourceName && (
            <>
              <span aria-hidden="true">·</span>
              <span>Keep</span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <aside
      aria-label="Notes sidebar"
      className="w-full md:w-[320px] shrink-0 border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-[var(--ink)] bg-black/[0.01] dark:bg-white/[0.01] flex flex-col h-full overflow-hidden select-none"
    >
      {/* Sidebar Header */}
      <div className="p-6 border-b border-[var(--ink-faint)]">
        <div className="relative mb-4">
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="SEARCH (⌘K)"
            aria-label="Search notes by title or content"
            className="w-full p-3 pr-8 bg-transparent border border-[var(--ink)] text-xs font-mono text-[var(--ink)] placeholder:text-[var(--ink-medium)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search query"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[var(--ink-medium)] hover:text-[var(--ink)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onCreateNote}
          aria-label="Create new note"
          className="btn-editorial-primary w-full text-center"
        >
          + New Note
        </button>

        {/* Interactive Category Filter Row */}
        <div
          className="flex flex-wrap items-center gap-1.5 mt-4"
          role="group"
          aria-label="Filter notes by category"
        >
          <button
            type="button"
            onClick={() => onSelectTag('all')}
            className={`text-[0.6rem] font-mono uppercase tracking-wider border px-2 py-0.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              selectedTag === 'all'
                ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]'
                : 'border-[var(--ink-faint)] text-[var(--ink)] hover:border-[var(--ink)]'
            }`}
          >
            All ({notes.length})
          </button>
          {TAG_CATEGORIES.map((cat) => {
            const isSelected = selectedTag === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectTag(cat.id)}
                className={`text-[0.6rem] font-mono uppercase tracking-wider border px-2 py-0.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]'
                    : 'border-[var(--ink-faint)] text-[var(--ink)] hover:border-[var(--ink)]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Note List Scroll Container */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-8 text-center space-y-4">
            <p className="editorial-label">No matching notes</p>
            <p className="text-xs text-[var(--ink-medium)]">
              {searchQuery || selectedTag !== 'all'
                ? 'Clear your active search or category filter.'
                : 'Create your first Markdown note to begin.'}
            </p>
            {searchQuery || selectedTag !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  onSelectTag('all');
                }}
                className="btn-editorial-primary"
              >
                Reset Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={onCreateNote}
                className="btn-editorial-primary"
              >
                Create First Note
              </button>
            )}
          </div>
        ) : (
          <>
            {pinnedNotes.length > 0 && (
              <div>
                <div className="editorial-label px-6 pt-6 pb-2">
                  Pinned — {pinnedNotes.length}
                </div>
                <div>{pinnedNotes.map(renderNoteCard)}</div>
              </div>
            )}

            {unpinnedNotes.length > 0 && (
              <div>
                <div className="editorial-label px-6 pt-6 pb-2">
                  Notes — {unpinnedNotes.length}
                </div>
                <div>{unpinnedNotes.map(renderNoteCard)}</div>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
