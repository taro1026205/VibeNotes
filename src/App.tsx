import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  INITIAL_NOTES,
  NoteItem,
  TagColor,
  filterAndSortNotes,
  createNewNoteItem,
  computeNoteMetrics,
} from './utils/notesLogic';
import { initAuth, googleSignIn, logout } from './services/keepService';
import { Sidebar } from './components/Sidebar';
import { NoteWorkspace, EditorViewMode } from './components/NoteWorkspace';
import { GoogleKeepDrawer } from './components/GoogleKeepDrawer';
import { ConfirmDialog } from './components/ConfirmDialog';

const STORAGE_KEY = 'vibenotes_workspace_notes_v1';
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

  // 2. Theme state (Variation 2 warm paper light mode by default, with full dark mode toggle)
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

  // 3. Active Note, Search, Filter & View Mode State
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() =>
    notes.length > 0 ? notes[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<TagColor | 'all'>('all');
  const [viewMode, setViewMode] = useState<EditorViewMode>('split');

  // 4. Delete Confirmation Modal State
  const [noteToDelete, setNoteToDelete] = useState<NoteItem | null>(null);

  // 5. Google Keep Integration & Auth State
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

  // Keyboard shortcut Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredNotes = useMemo(
    () => filterAndSortNotes(notes, searchQuery, selectedTag),
    [notes, searchQuery, selectedTag]
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
  const handleCreateNote = () => {
    const newNote = createNewNoteItem({
      tag: selectedTag === 'all' ? 'indigo' : selectedTag,
    });
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    if (viewMode === 'preview') {
      setViewMode('split');
    }
  };

  const handleUpdateNote = (id: string, changes: Partial<NoteItem>) => {
    const now = new Date().toISOString();
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, ...changes, updatedAt: now } : note
      )
    );
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    handleUpdateNote(id, { pinned: !target.pinned });
  };

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

  return (
    <div className="h-screen w-screen overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] grid-rows-[auto_1fr_auto] bg-[var(--bg)] text-[var(--ink)]">
      {/* Variation 2 Top Bar Contract */}
      <header className="col-span-full flex items-center justify-between gap-8 px-8 py-5 border-b-[1.5px] border-[var(--ink)] bg-[var(--bg)] shrink-0">
        {/* Zone 1: Brand wordmark in Cormorant Garamond */}
        <a
          href="#workspace"
          onClick={(e) => e.preventDefault()}
          className="brand text-2xl text-[var(--ink)] whitespace-nowrap shrink-0"
        >
          VibeNotes
        </a>

        {/* Zone 2: Editorial uppercase navigation links */}
        <nav
          aria-label="Workspace navigation"
          className="hidden md:flex items-center gap-8 text-xs font-medium uppercase tracking-[0.05em] text-[var(--ink-medium)]"
        >
          <a
            href="#all-notes"
            onClick={(e) => {
              e.preventDefault();
              setSelectedTag('all');
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

        {/* Zone 3: Primary CTA button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsKeepDrawerOpen(true)}
            className="btn-editorial-primary whitespace-nowrap shrink-0"
          >
            {!needsAuth && user ? 'Keep Connected' : 'Connect Google Keep'}
          </button>
        </div>
      </header>

      {/* Left Pane: Sidebar */}
      <Sidebar
        notes={filteredNotes}
        activeNoteId={activeNoteId}
        searchQuery={searchQuery}
        selectedTag={selectedTag}
        onSearchChange={setSearchQuery}
        onSelectTag={setSelectedTag}
        onSelectNote={setActiveNoteId}
        onCreateNote={handleCreateNote}
        onTogglePin={handleTogglePin}
        onRequestDeleteNote={handleRequestDeleteNote}
        searchInputRef={searchInputRef}
      />

      {/* Right Pane: Main Editor & Preview */}
      <NoteWorkspace
        note={activeNote}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onUpdateNote={handleUpdateNote}
        onRequestDeleteNote={(n) => handleRequestDeleteNote(n)}
        onCreateNote={handleCreateNote}
      />

      {/* Full-Width Editorial Footer */}
      <footer className="col-span-full px-8 py-3 border-t-[1.5px] border-[var(--ink)] bg-[var(--bg)] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="editorial-label">
          {metrics.words} Words · {metrics.characters} Chars · {metrics.lines} Lines · ~{metrics.readingTimeMin} Min Read
        </div>
        <div className="editorial-label">
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
    </div>
  );
}
