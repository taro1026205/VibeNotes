import React, { useState } from 'react';
import { Pin, Trash2, X, Plus, FolderInput } from 'lucide-react';
import {
  NoteItem,
  NoteTag,
  TagColor,
  extractPlainTextSnippet,
  getTagMetadata,
} from '../utils/notesLogic';

interface SidebarProps {
  notes: NoteItem[];
  allNotesCount: number;
  allFilters: NoteTag[];
  activeNoteId: string | null;
  searchQuery: string;
  selectedTag: TagColor | 'all';
  onSearchChange: (q: string) => void;
  onSelectTag: (tag: TagColor | 'all') => void;
  onCreateFilter: (label: string) => { ok: boolean; error?: string };
  onDeleteCustomFilter: (filterId: TagColor) => void;
  onMoveNoteToFilter: (noteId: string, targetFilterId: TagColor) => void;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onRequestDeleteNote: (note: NoteItem, e: React.MouseEvent) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  allNotesCount,
  allFilters,
  activeNoteId,
  searchQuery,
  selectedTag,
  onSearchChange,
  onSelectTag,
  onCreateFilter,
  onDeleteCustomFilter,
  onMoveNoteToFilter,
  onSelectNote,
  onCreateNote,
  onTogglePin,
  onRequestDeleteNote,
  searchInputRef,
}) => {
  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [filterError, setFilterError] = useState<string | null>(null);
  const [dragOverFilterId, setDragOverFilterId] = useState<string | null>(null);

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

  const handleCreateFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = onCreateFilter(newFilterName);
    if (!result.ok) {
      setFilterError(result.error || 'Invalid filter name.');
      return;
    }
    setNewFilterName('');
    setFilterError(null);
    setIsAddingFilter(false);
  };

  const renderNoteCard = (note: NoteItem) => {
    const isActive = note.id === activeNoteId;
    const tagMeta = getTagMetadata(note.tag, allFilters);
    const snippet = extractPlainTextSnippet(note.content, 85);

    return (
      <div
        key={note.id}
        role="button"
        tabIndex={0}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', note.id);
        }}
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

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="editorial-label flex items-center gap-1.5 min-w-0 !text-[0.55rem] whitespace-nowrap">
            <span className="shrink-0">{formatShortDate(note.updatedAt)}</span>
            {note.keepResourceName && (
              <>
                <span aria-hidden="true">·</span>
                <span className="shrink-0">Keep</span>
              </>
            )}
          </div>

          {/* Direct Filter Selector on each note card */}
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="inline-flex items-center"
          >
            <select
              value={note.tag}
              onChange={(e) => onMoveNoteToFilter(note.id, e.target.value)}
              aria-label={`Select filter for '${note.title || 'Untitled Note'}'`}
              title="Select filter"
              className="text-[0.55rem] font-mono uppercase tracking-wider bg-transparent border border-[var(--ink-faint)] hover:border-[var(--ink)] px-1.5 py-0.5 text-[var(--ink)] focus:outline-none cursor-pointer"
            >
              {allFilters.length === 0 && (
                <option value="" className="bg-[var(--surface)] text-[var(--ink)]">
                  All
                </option>
              )}
              {allFilters.map((f) => (
                <option
                  key={f.id}
                  value={f.id}
                  className="bg-[var(--surface)] text-[var(--ink)]"
                >
                  {f.label}
                </option>
              ))}
            </select>
          </div>
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
        <div className="relative mb-3">
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="SEARCH TITLE / CONTENT / FILTER (⌘K)"
            aria-label="Search notes by title, content, or filter"
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

        {/* Filters Header + Create Filter Toggle */}
        <div className="mt-4 flex items-center justify-between">
          <span className="editorial-label !text-[0.58rem]">Filters</span>
          <button
            type="button"
            onClick={() => {
              setIsAddingFilter((prev) => !prev);
              setFilterError(null);
            }}
            aria-label="Create new filter"
            className="inline-flex items-center gap-1 text-[0.6rem] font-mono uppercase tracking-wider px-1.5 py-0.5 border border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>New Filter</span>
          </button>
        </div>

        {/* Inline New Filter Form */}
        {isAddingFilter && (
          <form onSubmit={handleCreateFilterSubmit} className="mt-2.5 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newFilterName}
                onChange={(e) => {
                  setNewFilterName(e.target.value);
                  if (filterError) setFilterError(null);
                }}
                placeholder="Filter name..."
                aria-label="New filter name"
                autoFocus
                className="flex-1 min-w-0 px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--ink)] text-xs font-mono text-[var(--ink)] placeholder:text-[var(--ink-medium)] focus:outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-[var(--ink)] text-[var(--bg)] text-[0.6rem] font-mono font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap shrink-0"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingFilter(false);
                  setFilterError(null);
                }}
                aria-label="Cancel creating filter"
                className="p-1.5 border border-[var(--ink-faint)] text-[var(--ink-medium)] hover:text-[var(--ink)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {filterError && (
              <p className="text-[0.65rem] font-mono text-[#ff4444]" role="alert">
                {filterError}
              </p>
            )}
          </form>
        )}

        {/* Interactive Category Filter Row (supports clicking to filter and dropping a note to move) */}
        <div
          className="flex flex-wrap items-center gap-1.5 mt-2.5"
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
            All ({allNotesCount})
          </button>
          {allFilters.map((cat) => {
            const isSelected = selectedTag === cat.id;
            const isDragTarget = dragOverFilterId === cat.id;
            return (
              <div key={cat.id} className="inline-flex items-center">
                <button
                  type="button"
                  onClick={() => onSelectTag(cat.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverFilterId(cat.id);
                  }}
                  onDragLeave={() => setDragOverFilterId(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverFilterId(null);
                    const droppedNoteId = e.dataTransfer.getData('text/plain');
                    if (droppedNoteId) {
                      onMoveNoteToFilter(droppedNoteId, cat.id);
                    }
                  }}
                  className={`text-[0.6rem] font-mono uppercase tracking-wider border px-2 py-0.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected || isDragTarget
                      ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]'
                      : 'border-[var(--ink-faint)] text-[var(--ink)] hover:border-[var(--ink)]'
                  }`}
                >
                  {cat.label}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCustomFilter(cat.id)}
                  aria-label={`Remove filter ${cat.label}`}
                  title={`Delete filter ${cat.label}`}
                  className="border border-l-0 border-[var(--ink-faint)] hover:border-[var(--ink)] hover:text-[#ff4444] px-1 py-0.5 text-[0.6rem] font-mono text-[var(--ink-medium)] transition-colors cursor-pointer"
                >
                  ×
                </button>
              </div>
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
                ? 'Move a note into this filter or clear your active filter.'
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
