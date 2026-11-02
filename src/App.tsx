import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User } from 'firebase/auth';
import { PanelLeft, Sun, Moon, Info } from 'lucide-react';
import {
  INITIAL_NOTES,
  TAG_CATEGORIES,
  NoteItem,
  NoteTag,
  TagColor,
  filterAndSortNotes,
  createNewNoteItem,
  computeNoteMetrics,
  createCustomFilter,
  deleteFilterFromList,
  moveNoteToFilter,
  getTagMetadata,
  cycleEditorViewMode,
  resolveGlobalShortcutAction,
  NoteVersionHistoryMap,
  getNoteVersionStack,
  recordNoteVersionSnapshot,
  restorePreviousNoteVersion,
} from './utils/notesLogic';
import { exportNoteToPdf } from './utils/pdfExport';
import { initAuth, googleSignIn, logout } from './services/keepService';
import { Sidebar } from './components/Sidebar';
import { NoteWorkspace, EditorViewMode } from './components/NoteWorkspace';
import { GoogleKeepDrawer } from './components/GoogleKeepDrawer';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ShortcutsModal } from './components/ShortcutsModal';

const STORAGE_KEY = 'vibenotes_workspace_notes_v1';
const FILTERS_STORAGE_KEY = 'vibenotes_custom_filters_v1';
const VERSION_HISTORY_STORAGE_KEY = 'vibenotes_version_history_v1';
const THEME_KEY = 'vibenotes_theme_v2';

export default function App() {
  // 1. Notes state persisted to localStorage
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load notes from localStorage:', e);
    }
    return INITIAL_NOTES;
  });

  // 2. Filters / Categories state (default + user-created custom filters; all deletable except 'All')
  const [allFilters, setAllFilters] = useState<NoteTag[]>(() => {
    try {
      const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load custom filters from localStorage:', e);
    }
    return TAG_CATEGORIES;
  });

  // 2b. Local Note Version History stack persisted to localStorage
  const [versionHistory, setVersionHistory] = useState<NoteVersionHistoryMap>(() => {
    try {
      const raw = localStorage.getItem(VERSION_HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load version history from localStorage:', e);
    }
    return {};
  });

  // 3. Theme state (Variation 2 warm paper light mode by default, with full dark mode toggle)
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
    } catch {
      // ignore
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  // Persist notes to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save notes to localStorage:', e);
    }
  }, [notes]);

  // Persist filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(allFilters));
    } catch (e) {
      console.error('Failed to save filters to localStorage:', e);
    }
  }, [allFilters]);

  // Persist note version history stack to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        VERSION_HISTORY_STORAGE_KEY,
        JSON.stringify(versionHistory)
      );
    } catch (e) {
      console.error('Failed to save version history to localStorage:', e);
    }
  }, [versionHistory]);

  // 4. Active Note, Search, Filter, View Mode & Responsive Sidebar Drawer State
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() =>
    notes.length > 0 ? notes[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<TagColor | 'all'>('all');
  const [viewMode, setViewMode] = useState<EditorViewMode>('split');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  // Automatically adapt sidebar drawer when crossing the 1024px breakpoint (e.g. rotating tablet or resizing)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsSidebarOpen(e.matches);
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // 5. Delete Confirmation Modal, Shortcuts Info Modal & Export PDF State
  const [noteToDelete, setNoteToDelete] = useState<NoteItem | null>(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // 6. Google Keep Integration & Auth State
  const [isKeepDrawerOpen, setIsKeepDrawerOpen] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser) => {
        setUser(authedUser);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredNotes = useMemo(
    () => filterAndSortNotes(notes, searchQuery, selectedTag, allFilters),
    [notes, searchQuery, selectedTag, allFilters]
  );

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) || null,
    [notes, activeNoteId]
  );

  const metrics = useMemo(
    () => computeNoteMetrics(activeNote?.content || ''),
    [activeNote?.content]
  );

  // Handlers
  const handleCreateFilter = (label: string): { ok: boolean; error?: string } => {
    const { updatedFilters, createdFilter, error } = createCustomFilter(
      allFilters,
      label
    );
    if (error || !createdFilter) {
      return { ok: false, error };
    }
    setAllFilters(updatedFilters);
    return { ok: true };
  };

  const handleDeleteCustomFilter = (filterId: TagColor) => {
    const { updatedFilters, updatedNotes } = deleteFilterFromList(
      allFilters,
      notes,
      filterId
    );
    setAllFilters(updatedFilters);
    setNotes(updatedNotes);
    if (selectedTag === filterId) {
      setSelectedTag('all');
    }
  };

  const handleMoveNoteToFilter = (noteId: string, targetFilterId: TagColor) => {
    setNotes((prev) => moveNoteToFilter(prev, noteId, targetFilterId));
  };

  const handleCreateNote = () => {
    const newNote = createNewNoteItem({
      tag: selectedTag === 'all' ? (allFilters[0]?.id || '') : selectedTag,
    });
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    if (viewMode === 'preview') {
      setViewMode('split');
    }
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectNote = (id: string) => {
    setActiveNoteId(id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleUpdateNote = (id: string, changes: Partial<NoteItem>) => {
    const now = new Date().toISOString();
    if (changes.title !== undefined || changes.content !== undefined) {
      const existingNote = notes.find((n) => n.id === id);
      if (existingNote) {
        setVersionHistory((prevHistory) =>
          recordNoteVersionSnapshot(prevHistory, existingNote, {
            title: changes.title,
            content: changes.content,
          })
        );
      }
    }
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, ...changes, updatedAt: now } : note
      )
    );
  };

  const handleRestorePreviousVersion = (id: string) => {
    const { updatedHistoryMap, restoredSnapshot } = restorePreviousNoteVersion(
      versionHistory,
      id
    );
    if (!restoredSnapshot) return;

    const now = new Date().toISOString();
    setVersionHistory(updatedHistoryMap);
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              title: restoredSnapshot.title,
              content: restoredSnapshot.content,
              updatedAt: now,
            }
          : note
      )
    );
  };

  const handleTogglePin = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    handleUpdateNote(id, { pinned: !target.pinned });
  };

  // Global keyboard shortcuts: Cmd/Ctrl+N (New Note), Cmd/Ctrl+E (Switch View), Cmd/Ctrl+P (Pin Note), Cmd/Ctrl+K (Search), Cmd/Ctrl+/ or ? (Shortcuts Modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetEl = e.target as HTMLElement | null;
      const isEditableTarget = Boolean(
        targetEl &&
          (targetEl.tagName === 'INPUT' ||
            targetEl.tagName === 'TEXTAREA' ||
            targetEl.tagName === 'SELECT' ||
            targetEl.isContentEditable)
      );

      const action = resolveGlobalShortcutAction({
        key: e.key,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        isEditableTarget,
      });

      if (!action) return;

      e.preventDefault();
      if (action === 'new-note') {
        handleCreateNote();
      } else if (action === 'cycle-view') {
        setViewMode((prev) => cycleEditorViewMode(prev));
      } else if (action === 'toggle-pin') {
        if (activeNote) {
          handleUpdateNote(activeNote.id, { pinned: !activeNote.pinned });
        }
      } else if (action === 'focus-search') {
        setIsSidebarOpen(true);
        requestAnimationFrame(() => {
          searchInputRef.current?.focus();
        });
      } else if (action === 'toggle-shortcuts-modal') {
        setIsShortcutsModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleRequestDeleteNote = (note: NoteItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNoteToDelete(note);
  };

  const handleConfirmDeleteNote = () => {
    if (!noteToDelete) return;
    const deletedId = noteToDelete.id;
    setNotes((prev) => {
      const remaining = prev.filter((n) => n.id !== deletedId);
      if (activeNoteId === deletedId) {
        setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
    setVersionHistory((prev) => {
      if (!prev[deletedId]) return prev;
      const next = { ...prev };
      delete next[deletedId];
      return next;
    });
    setNoteToDelete(null);
  };

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Google Sign-In failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
  };

  const handleImportKeepNote = (
    title: string,
    content: string,
    keepResourceName: string
  ) => {
    const imported = createNewNoteItem({
      title,
      content: `# ${title}\n\n${content}`,
      tag: 'sky',
      keepResourceName,
    });
    setNotes((prev) => [imported, ...prev]);
    setActiveNoteId(imported.id);
  };

  const handleExportMarkdown = () => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (activeNote.title || 'untitled-note')
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-');
    a.href = url;
    a.download = `${safeName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    if (!activeNote || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const filterLabel = activeNote.tag
        ? getTagMetadata(activeNote.tag, allFilters).label
        : 'All';
      await exportNoteToPdf(activeNote, filterLabel);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div
      className={`h-[100dvh] w-screen overflow-hidden grid grid-rows-[auto_1fr_auto] bg-[var(--bg)] text-[var(--ink)] ${
        isSidebarOpen ? 'grid-cols-1 lg:grid-cols-[320px_1fr]' : 'grid-cols-1'
      }`}
    >
      {/* Variation 2 Top Bar Contract — Responsive on Mobile, Tablet & Desktop */}
      <header className="col-span-full flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-8 py-3.5 sm:py-4 border-b-[1.5px] border-[var(--ink)] bg-[var(--bg)] shrink-0 z-20">
        {/* Zone 1: Sidebar Toggle + Brand wordmark in Cormorant Garamond */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label="Toggle sidebar navigation"
            title={isSidebarOpen ? 'Collapse notes sidebar' : 'Expand notes sidebar'}
            className="p-1.5 border border-[var(--ink-faint)] hover:border-[var(--ink)] text-[var(--ink)] transition-colors cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <a
            href="#workspace"
            onClick={(e) => e.preventDefault()}
            className="brand text-xl sm:text-2xl text-[var(--ink)] whitespace-nowrap shrink-0"
          >
            VibeNotes
          </a>
        </div>

        {/* Zone 2: Editorial uppercase navigation links (Tablet & Desktop) */}
        <nav
          aria-label="Workspace navigation"
          className="hidden md:flex items-center gap-5 lg:gap-8 text-xs font-medium uppercase tracking-[0.05em] text-[var(--ink-medium)]"
        >
          <a
            href="#all-notes"
            onClick={(e) => {
              e.preventDefault();
              setSelectedTag('all');
              setIsSidebarOpen(true);
            }}
            className="hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0"
          >
            All Notes
          </a>
          <a
            href="#export"
            onClick={(e) => {
              e.preventDefault();
              handleExportMarkdown();
            }}
            className="hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0"
          >
            Export Markdown
          </a>
          <a
            href="#export-pdf"
            onClick={(e) => {
              e.preventDefault();
              handleExportPdf();
            }}
            className="hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0"
          >
            {isExportingPdf ? 'Exporting PDF...' : 'Export PDF'}
          </a>
          <a
            href="#keep"
            onClick={(e) => {
              e.preventDefault();
              setIsKeepDrawerOpen(true);
            }}
            className="hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0"
          >
            Google Keep
          </a>
          <a
            href="#theme"
            onClick={(e) => {
              e.preventDefault();
              setIsDark((prev) => !prev);
            }}
            className="hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0"
          >
            {isDark ? 'Light Theme' : 'Dark Theme'}
          </a>
        </nav>

        {/* Zone 3: Quick Actions (Info/Shortcuts, Theme) + Primary Google Keep CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsShortcutsModalOpen(true)}
            aria-label="Open keyboard shortcuts cheat-sheet"
            title="Keyboard Shortcuts Cheat-Sheet (Cmd/Ctrl + /)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-[var(--ink-faint)] hover:border-[var(--ink)] text-[0.65rem] font-mono uppercase tracking-wider text-[var(--ink)] transition-colors cursor-pointer shrink-0"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Shortcuts</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDark((prev) => !prev)}
            aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="md:hidden p-1.5 border border-[var(--ink-faint)] hover:border-[var(--ink)] text-[var(--ink)] cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setIsKeepDrawerOpen(true)}
            className="btn-editorial-primary whitespace-nowrap shrink-0 !px-2.5 sm:!px-4 !py-1.5 sm:!py-2 !text-[0.62rem] sm:!text-[0.68rem]"
          >
            {!needsAuth && user ? 'Keep Connected' : 'Connect Google Keep'}
          </button>
        </div>
      </header>

      {/* Left Pane: Sidebar (Slide-over drawer on mobile/tablet, collapsible column on desktop) */}
      <Sidebar
        notes={filteredNotes}
        allNotesCount={notes.length}
        allFilters={allFilters}
        activeNoteId={activeNoteId}
        searchQuery={searchQuery}
        selectedTag={selectedTag}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onSearchChange={setSearchQuery}
        onSelectTag={setSelectedTag}
        onCreateFilter={handleCreateFilter}
        onDeleteCustomFilter={handleDeleteCustomFilter}
        onMoveNoteToFilter={handleMoveNoteToFilter}
        onSelectNote={handleSelectNote}
        onCreateNote={handleCreateNote}
        onTogglePin={handleTogglePin}
        onRequestDeleteNote={handleRequestDeleteNote}
        searchInputRef={searchInputRef}
      />

      {/* Right Pane: Main Editor & Preview */}
      <NoteWorkspace
        note={activeNote}
        allFilters={allFilters}
        viewMode={viewMode}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onViewModeChange={setViewMode}
        onUpdateNote={handleUpdateNote}
        onMoveNoteToFilter={handleMoveNoteToFilter}
        onRequestDeleteNote={(n) => handleRequestDeleteNote(n)}
        onCreateNote={handleCreateNote}
        onExportPdf={handleExportPdf}
        isExportingPdf={isExportingPdf}
        previousVersionsCount={
          activeNote ? getNoteVersionStack(versionHistory, activeNote.id).length : 0
        }
        onRestorePreviousVersion={() =>
          activeNote && handleRestorePreviousVersion(activeNote.id)
        }
      />

      {/* Full-Width Editorial Footer */}
      <footer className="col-span-full px-4 sm:px-8 py-2.5 sm:py-3 border-t-[1.5px] border-[var(--ink)] bg-[var(--bg)] flex flex-wrap items-center justify-between gap-2 sm:gap-4 shrink-0">
        <div className="editorial-label !text-[0.58rem] sm:!text-[0.65rem]">
          {metrics.words} Words · {metrics.characters} Chars · {metrics.lines} Lines · ~{metrics.readingTimeMin} Min Read
        </div>
        <div className="editorial-label !text-[0.58rem] sm:!text-[0.65rem]">
          Saved · Updated{' '}
          {activeNote
            ? new Date(activeNote.updatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Just now'}
        </div>
      </footer>

      {/* Google Keep Integration Drawer */}
      <GoogleKeepDrawer
        isOpen={isKeepDrawerOpen}
        onClose={() => setIsKeepDrawerOpen(false)}
        user={user}
        needsAuth={needsAuth}
        isLoggingIn={isLoggingIn}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleGoogleSignOut}
        activeNote={activeNote}
        onImportKeepNote={handleImportKeepNote}
        onUpdateActiveNoteKeepResource={(noteId, resourceName) =>
          handleUpdateNote(noteId, { keepResourceName: resourceName })
        }
      />

      {/* Delete Note Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(noteToDelete)}
        title="Delete Note?"
        description={`Are you sure you want to delete "${
          noteToDelete?.title || 'Untitled Note'
        }"? This will remove it from local storage and cannot be undone.`}
        confirmLabel="Delete Note"
        variant="danger"
        onCancel={() => setNoteToDelete(null)}
        onConfirm={handleConfirmDeleteNote}
      />

      {/* Keyboard Shortcuts Cheat-Sheet Info Modal */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}
