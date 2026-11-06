import React, { useState } from 'react';
import {
  Pin,
  Trash2,
  X,
  Plus,
  PanelLeftClose,
  LogOut,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import {
  NoteItem,
  NoteTag,
  TagColor,
  NoteSortOption,
  NOTE_SORT_OPTIONS,
  WorkspaceUserProfile,
  extractPlainTextSnippet,
} from '../utils/notesLogic';

interface SidebarProps {
  notes: NoteItem[];
  allNotesCount: number;
  allFilters: NoteTag[];
  activeNoteId: string | null;
  searchQuery: string;
  selectedTag: TagColor | 'all';
  sortBy?: NoteSortOption;
  isOpen?: boolean;
  userProfile?: WorkspaceUserProfile | null;
  onSignOut?: () => void;
  onCloseMobile?: () => void;
  onSearchChange: (q: string) => void;
  onSelectTag: (tag: TagColor | 'all') => void;
  onSelectSortBy?: (sortBy: NoteSortOption) => void;
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
  sortBy = 'pinned',
  isOpen = true,
  userProfile,
  onSignOut,
  onCloseMobile,
  onSearchChange,
  onSelectTag,
  onSelectSortBy,
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
        className={`group relative px-5 py-4 sm:p-6 border-b border-[var(--ink-faint)] transition-colors cursor-pointer text-left ${
          isActive
            ? 'bg-[var(--surface)] ring-1 ring-inset ring-[var(--ink)]'
            : 'bg-transparent hover:bg-[var(--surface)]/70 active:bg-[var(--surface)]'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[1.02rem] sm:text-[1.05rem] font-semibold leading-snug text-[var(--ink)] font-display">
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
              className={`p-1.5 sm:p-1 transition-opacity ${
                note.pinned
                  ? 'text-[var(--ink)] opacity-100'
                  : 'text-[var(--ink-medium)] opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:text-[var(--ink)]'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => onRequestDeleteNote(note, e)}
              aria-label={`Delete '${note.title || 'Untitled Note'}'`}
              className="p-1.5 sm:p-1 text-[var(--ink-medium)] opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:text-[#ff4444] transition-opacity"
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
            {sortBy !== 'pinned' && note.pinned && (
              <>
                <span className="shrink-0 font-bold text-[var(--ink)]">Pinned</span>
                <span aria-hidden="true">·</span>
              </>
            )}
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

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Notion-style Translucent Backdrop on Mobile & Tablet (< 1024px) */}
      <div
        onClick={onCloseMobile}
        aria-hidden="true"
        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1.5px] lg:hidden transition-opacity"
      />

      <aside
        aria-label="Notes sidebar"
        className="fixed inset-y-0 left-0 z-40 w-[86vw] max-w-[320px] lg:static lg:z-auto lg:w-[320px] shrink-0 border-r-[1.5px] border-[var(--ink)] bg-[var(--bg)] flex flex-col h-full overflow-hidden select-none shadow-2xl lg:shadow-none transition-transform duration-200 ease-out"
      >
        {/* Mobile & Tablet Drawer Header Bar */}
        <div className="flex lg:hidden items-center justify-between px-5 py-3.5 border-b border-[var(--ink-faint)] bg-[var(--surface)]">
          <span className="editorial-label !text-[0.62rem] font-bold text-[var(--ink)]">
            Workspace Notes ({allNotesCount})
          </span>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close notes sidebar"
              className="inline-flex items-center gap-1 px-2 py-1 border border-[var(--ink-faint)] text-[0.6rem] font-mono uppercase tracking-wider text-[var(--ink)] hover:border-[var(--ink)] cursor-pointer"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          )}
        </div>

        {/* Left Corner User Profile Bar (Click User Name to open Sign Out menu) */}
        {userProfile && (
          <div className="border-b border-[var(--ink-faint)] bg-[var(--surface)] shrink-0">
            <button
              type="button"
              data-testid="sidebar-user-profile"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
              title="Click user name to open Sign Out menu"
              className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2.5 text-left hover:bg-[var(--bg)] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  aria-hidden="true"
                  className="w-7 h-7 bg-[var(--ink)] text-[var(--bg)] font-mono text-[0.65rem] font-bold flex items-center justify-center shrink-0 leading-none uppercase"
                >
                  {userProfile.name
                    .trim()
                    .split(/\s+/)
                    .map((w) => w[0] || '')
                    .join('')
                    .slice(0, 2) || 'VN'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--ink)] truncate group-hover:underline">
                    {userProfile.name}
                  </div>
                  <div
                    className="editorial-label !text-[0.52rem] truncate"
                    title={`${userProfile.provider.toUpperCase()} · ${userProfile.email}`}
                  >
                    {userProfile.email}
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 border border-transparent group-hover:border-[var(--ink-faint)] text-[0.55rem] font-mono uppercase tracking-wider text-[var(--ink-medium)] group-hover:text-[var(--ink)] shrink-0 transition-colors">
                <span>Account</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {isUserMenuOpen && onSignOut && (
              <div
                role="menu"
                data-testid="sidebar-user-menu"
                className="px-4 sm:px-6 py-3 bg-[var(--bg)] border-t border-[var(--ink-faint)] space-y-2.5"
              >
                <div className="flex items-center justify-between text-[0.6rem] font-mono uppercase tracking-wider text-[var(--ink-medium)]">
                  <span>
                    Signed in via{' '}
                    {userProfile.provider === 'google'
                      ? 'Google'
                      : userProfile.provider === 'guest'
                        ? 'Guest'
                        : 'Email'}
                  </span>
                  <span className="text-[var(--ink)] font-bold">Active</span>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  data-testid="sidebar-signout-button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onSignOut();
                  }}
                  aria-label="Sign out and return to login page"
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-[var(--ink)] bg-[var(--surface)] hover:bg-[var(--ink)] text-[var(--ink)] hover:text-[var(--bg)] text-[0.65rem] font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sidebar Search & Filter Header */}
        <div className="p-4 sm:p-6 border-b border-[var(--ink-faint)] shrink-0">
          <div className="relative mb-3">
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="SEARCH TITLE / CONTENT / FILTER (⌘K)"
              aria-label="Search notes by title, content, or filter"
              className="w-full p-2.5 sm:p-3 pr-8 bg-transparent border border-[var(--ink)] text-xs font-mono text-[var(--ink)] placeholder:text-[var(--ink-medium)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
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

          {/* Sort By Dropdown */}
          <div className="mt-4 flex items-center justify-between gap-2 pb-3 border-b border-[var(--ink-faint)]">
            <label
              htmlFor="sidebar-sort-select"
              className="editorial-label !text-[0.58rem] inline-flex items-center gap-1.5 shrink-0"
            >
              <ArrowUpDown className="w-3 h-3 text-[var(--ink-medium)]" />
              <span>Sort By</span>
            </label>
            <select
              id="sidebar-sort-select"
              data-testid="sidebar-sort-select"
              value={sortBy}
              onChange={(e) =>
                onSelectSortBy && onSelectSortBy(e.target.value as NoteSortOption)
              }
              aria-label="Sort notes by"
              className="text-[0.6rem] font-mono uppercase tracking-wider bg-[var(--surface)] border border-[var(--ink)] px-2 py-1 text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)] cursor-pointer"
            >
              {NOTE_SORT_OPTIONS.map((opt) => (
                <option
                  key={opt.id}
                  value={opt.id}
                  className="bg-[var(--surface)] text-[var(--ink)]"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filters Header + Create Filter Toggle */}
          <div className="mt-3 flex items-center justify-between">
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

          {/* Interactive Category Filter Row */}
          <div
            className="flex flex-wrap items-center gap-1.5 mt-2.5 max-h-28 overflow-y-auto smooth-touch-scroll"
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

        {/* Note List Scroll Container with Smooth Touch Momentum */}
        <div
          data-testid="sidebar-notes-list"
          className="flex-1 min-h-0 overflow-y-auto smooth-touch-scroll"
        >
          {notes.length === 0 ? (
            <div
              data-testid="sidebar-empty-state"
              className="p-8 text-center space-y-4"
            >
              <p className="editorial-label">
                {searchQuery || selectedTag !== 'all'
                  ? 'No matching notes'
                  : 'No notes yet'}
              </p>
              <p className="text-xs text-[var(--ink-medium)]">
                {searchQuery || selectedTag !== 'all'
                  ? 'Move a note into this filter or clear your active filter.'
                  : 'Your workspace is empty. Create your first Markdown note to begin.'}
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
          ) : sortBy === 'pinned' ? (
            <>
              {pinnedNotes.length > 0 && (
                <div>
                  <div className="editorial-label px-5 sm:px-6 pt-5 pb-2">
                    Pinned — {pinnedNotes.length}
                  </div>
                  <div>{pinnedNotes.map(renderNoteCard)}</div>
                </div>
              )}

              {unpinnedNotes.length > 0 && (
                <div>
                  <div className="editorial-label px-5 sm:px-6 pt-5 pb-2">
                    Notes — {unpinnedNotes.length}
                  </div>
                  <div>{unpinnedNotes.map(renderNoteCard)}</div>
                </div>
              )}
            </>
          ) : (
            <div>
              <div className="editorial-label px-5 sm:px-6 pt-5 pb-2">
                {sortBy === 'title'
                  ? `Sorted by Title (A–Z) — ${notes.length}`
                  : `Sorted by Date Modified — ${notes.length}`}
              </div>
              <div>{notes.map(renderNoteCard)}</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
