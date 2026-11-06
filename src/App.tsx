import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User } from 'firebase/auth';
import { PanelLeft, Sun, Moon, Info, LogOut, ChevronUp } from 'lucide-react';
import {
  TAG_CATEGORIES,
  NoteItem,
  NoteTag,
  TagColor,
  NoteSortOption,
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
  WorkspaceUserProfile,
  RegisteredWorkspaceAccount,
  createGoogleDemoUserProfile,
  AccountNotesMap,
  normalizeAccountStorageKey,
  getNotesForAccount,
  initializeAccountNotesOnAuth,
  mergeDefaultRegisteredAccounts,
} from './utils/notesLogic';
import { exportNoteToPdf } from './utils/pdfExport';
import { initAuth, googleSignIn, logout } from './services/keepService';
import { Sidebar } from './components/Sidebar';
import { NoteWorkspace, EditorViewMode } from './components/NoteWorkspace';
import { GoogleKeepDrawer } from './components/GoogleKeepDrawer';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ShortcutsModal } from './components/ShortcutsModal';
import { LoginView } from './components/LoginView';

const ACCOUNT_NOTES_STORAGE_KEY = 'vibenotes_account_notes_v2';
const ACCOUNT_FILTERS_STORAGE_KEY = 'vibenotes_account_filters_v2';
const ACCOUNT_VERSION_HISTORY_STORAGE_KEY = 'vibenotes_account_version_history_v2';
const USER_PROFILE_STORAGE_KEY = 'vibenotes_user_profile_v1';
const REGISTERED_USERS_STORAGE_KEY = 'vibenotes_registered_users_v1';
const SORT_BY_STORAGE_KEY = 'vibenotes_sort_by_v1';
const THEME_KEY = 'vibenotes_theme_v2';

export default function App() {
  // 1. View-level User Profile state (persisted to localStorage; supports ?autostart=1 bypass)
  const [userProfile, setUserProfile] = useState<WorkspaceUserProfile | null>(() => {
    try {
      const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.name === 'string' && parsed.name.trim()) {
          return parsed;
        }
      }
      if (
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('autostart') === '1'
      ) {
        return createGoogleDemoUserProfile();
      }
    } catch (e) {
      console.error('Failed to load user profile from localStorage:', e);
    }
    return null;
  });

  // 2. Per-account Notes map persisted to localStorage (new accounts always start with 0 notes: [])
  const [accountNotesMap, setAccountNotesMap] = useState<AccountNotesMap>(() => {
    try {
      const raw = localStorage.getItem(ACCOUNT_NOTES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load account notes from localStorage:', e);
    }
    return {};
  });

  // 3. Per-account Filters / Categories state
  const [accountFiltersMap, setAccountFiltersMap] = useState<
    Record<string, NoteTag[]>
  >(() => {
    try {
      const raw = localStorage.getItem(ACCOUNT_FILTERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load account filters from localStorage:', e);
    }
    return {};
  });

  // 4. Per-account Local Note Version History stack
  const [accountVersionHistoryMap, setAccountVersionHistoryMap] = useState<
    Record<string, NoteVersionHistoryMap>
  >(() => {
    try {
      const raw = localStorage.getItem(ACCOUNT_VERSION_HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load account version history from localStorage:', e);
    }
    return {};
  });

  const activeAccountKey = useMemo(
    () => (userProfile ? normalizeAccountStorageKey(userProfile.email) : null),
    [userProfile]
  );

  const notes = useMemo(
    () => getNotesForAccount(accountNotesMap, userProfile),
    [accountNotesMap, userProfile]
  );

  const allFilters = useMemo(() => {
    if (!activeAccountKey) return TAG_CATEGORIES;
    const saved = accountFiltersMap[activeAccountKey];
    return Array.isArray(saved) ? saved : TAG_CATEGORIES;
  }, [accountFiltersMap, activeAccountKey]);

  const versionHistory = useMemo(() => {
    if (!activeAccountKey) return {};
    return accountVersionHistoryMap[activeAccountKey] || {};
  }, [accountVersionHistoryMap, activeAccountKey]);

  const setNotes = (
    updater: NoteItem[] | ((prev: NoteItem[]) => NoteItem[])
  ) => {
    if (!activeAccountKey) return;
    setAccountNotesMap((prevMap) => {
      const currentNotes = Array.isArray(prevMap[activeAccountKey])
        ? prevMap[activeAccountKey]
        : [];
      const nextNotes =
        typeof updater === 'function' ? updater(currentNotes) : updater;
      return {
        ...prevMap,
        [activeAccountKey]: nextNotes,
      };
    });
  };

  const setAllFilters = (
    updater: NoteTag[] | ((prev: NoteTag[]) => NoteTag[])
  ) => {
    if (!activeAccountKey) return;
    setAccountFiltersMap((prevMap) => {
      const currentFilters = Array.isArray(prevMap[activeAccountKey])
        ? prevMap[activeAccountKey]
        : TAG_CATEGORIES;
      const nextFilters =
        typeof updater === 'function' ? updater(currentFilters) : updater;
      return {
        ...prevMap,
        [activeAccountKey]: nextFilters,
      };
    });
  };

  const setVersionHistory = (
    updater:
      | NoteVersionHistoryMap
      | ((prev: NoteVersionHistoryMap) => NoteVersionHistoryMap)
  ) => {
    if (!activeAccountKey) return;
    setAccountVersionHistoryMap((prevMap) => {
      const currentHistory = prevMap[activeAccountKey] || {};
      const nextHistory =
        typeof updater === 'function' ? updater(currentHistory) : updater;
      return {
        ...prevMap,
        [activeAccountKey]: nextHistory,
      };
    });
  };

  // 5. Theme state (Variation 2 warm paper light mode by default, with full dark mode toggle)
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

  const [registeredAccounts, setRegisteredAccounts] = useState<
    RegisteredWorkspaceAccount[]
  >(() => {
    try {
      const raw = localStorage.getItem(REGISTERED_USERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return mergeDefaultRegisteredAccounts(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load registered accounts from localStorage:', e);
    }
    return mergeDefaultRegisteredAccounts([]);
  });

  const [isFooterUserMenuOpen, setIsFooterUserMenuOpen] = useState(false);

  // 6. Active Note, Search, Filter, Sort, View Mode & Responsive Sidebar Drawer State
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    const initialNotes = getNotesForAccount(accountNotesMap, userProfile);
    return initialNotes.length > 0 ? initialNotes[0].id : null;
  });

  const handleRegisterAccounts = (updatedAccounts: RegisteredWorkspaceAccount[]) => {
    setRegisteredAccounts(updatedAccounts);
    try {
      localStorage.setItem(
        REGISTERED_USERS_STORAGE_KEY,
        JSON.stringify(updatedAccounts)
      );
    } catch (e) {
      console.error('Failed to save registered accounts to localStorage:', e);
    }
  };

  const handleLoginSuccess = (profile: WorkspaceUserProfile) => {
    const { updatedAccountNotesMap, accountNotes } =
      initializeAccountNotesOnAuth(accountNotesMap, profile);
    const accountKey = normalizeAccountStorageKey(profile.email);

    setAccountNotesMap(updatedAccountNotesMap);
    if (profile.isNewUser) {
      setAccountFiltersMap((prev) => ({
        ...prev,
        [accountKey]: TAG_CATEGORIES,
      }));
      setAccountVersionHistoryMap((prev) => ({
        ...prev,
        [accountKey]: {},
      }));
    }

    setUserProfile(profile);
    setActiveNoteId(accountNotes.length > 0 ? accountNotes[0].id : null);
    setSearchQuery('');
    setSelectedTag('all');
    setIsFooterUserMenuOpen(false);
    try {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
      localStorage.setItem(
        ACCOUNT_NOTES_STORAGE_KEY,
        JSON.stringify(updatedAccountNotesMap)
      );
    } catch (e) {
      console.error('Failed to save user profile to localStorage:', e);
    }
  };

  const handleSignOutUser = () => {
    setIsFooterUserMenuOpen(false);
    setUserProfile(null);
    setActiveNoteId(null);
    setSearchQuery('');
    setSelectedTag('all');
    try {
      localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear user profile from localStorage:', e);
    }
  };

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

  // Persist per-account notes map to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        ACCOUNT_NOTES_STORAGE_KEY,
        JSON.stringify(accountNotesMap)
      );
    } catch (e) {
      console.error('Failed to save account notes to localStorage:', e);
    }
  }, [accountNotesMap]);

  // Persist per-account filters map to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        ACCOUNT_FILTERS_STORAGE_KEY,
        JSON.stringify(accountFiltersMap)
      );
    } catch (e) {
      console.error('Failed to save account filters to localStorage:', e);
    }
  }, [accountFiltersMap]);

  // Persist per-account note version history map to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        ACCOUNT_VERSION_HISTORY_STORAGE_KEY,
        JSON.stringify(accountVersionHistoryMap)
      );
    } catch (e) {
      console.error('Failed to save account version history to localStorage:', e);
    }
  }, [accountVersionHistoryMap]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<TagColor | 'all'>('all');
  const [sortBy, setSortBy] = useState<NoteSortOption>(() => {
    try {
      const saved = localStorage.getItem(SORT_BY_STORAGE_KEY);
      if (saved === 'dateModified' || saved === 'title' || saved === 'pinned') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'pinned';
  });
  const [viewMode, setViewMode] = useState<EditorViewMode>('split');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    try {
      localStorage.setItem(SORT_BY_STORAGE_KEY, sortBy);
    } catch {
      // ignore
    }
  }, [sortBy]);

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
    () => filterAndSortNotes(notes, searchQuery, selectedTag, allFilters, sortBy),
    [notes, searchQuery, selectedTag, allFilters, sortBy]
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

  if (!userProfile) {
    return (
      <LoginView
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        registeredAccounts={registeredAccounts}
        onRegisterAccount={handleRegisterAccounts}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

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
        sortBy={sortBy}
        isOpen={isSidebarOpen}
        userProfile={userProfile}
        onSignOut={handleSignOutUser}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onSearchChange={setSearchQuery}
        onSelectTag={setSelectedTag}
        onSelectSortBy={setSortBy}
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

      {/* Full-Width Editorial Footer (Click User Name in bottom-left corner to open Sign Out menu) */}
      <footer className="relative col-span-full px-4 sm:px-8 py-2.5 sm:py-3 border-t-[1.5px] border-[var(--ink)] bg-[var(--bg)] flex flex-wrap items-center justify-between gap-2 sm:gap-4 shrink-0">
        <div className="relative flex items-center gap-1.5 editorial-label !text-[0.58rem] sm:!text-[0.65rem]">
          <button
            type="button"
            data-testid="footer-user-profile"
            onClick={() => setIsFooterUserMenuOpen((prev) => !prev)}
            aria-expanded={isFooterUserMenuOpen}
            aria-haspopup="menu"
            title="Click user name to open Sign Out menu"
            className="inline-flex items-center gap-1 font-bold text-[var(--ink)] hover:underline cursor-pointer"
          >
            <span>{userProfile.name}</span>
            <ChevronUp
              className={`w-3 h-3 transition-transform duration-150 ${
                isFooterUserMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isFooterUserMenuOpen && (
            <div
              role="menu"
              data-testid="footer-user-menu"
              className="absolute bottom-full left-0 mb-2.5 w-64 p-3.5 border-[1.5px] border-[var(--ink)] bg-[var(--surface)] shadow-xl z-50 space-y-2.5"
            >
              <div className="border-b border-[var(--ink-faint)] pb-2">
                <div className="text-xs font-semibold text-[var(--ink)] truncate normal-case tracking-normal">
                  {userProfile.name}
                </div>
                <div className="editorial-label !text-[0.55rem] truncate mt-0.5">
                  {userProfile.email}
                </div>
              </div>
              <button
                type="button"
                role="menuitem"
                data-testid="footer-signout-button"
                onClick={handleSignOutUser}
                aria-label="Sign out from bottom-left user menu"
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-[var(--ink)] bg-[var(--bg)] hover:bg-[var(--ink)] text-[var(--ink)] hover:text-[var(--bg)] text-[0.62rem] font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          <span>
            · {metrics.words} Words · {metrics.characters} Chars · {metrics.lines} Lines · ~{metrics.readingTimeMin} Min Read
          </span>
        </div>
        <div className="editorial-label !text-[0.58rem] sm:!text-[0.65rem]">
          {activeNote
            ? `Saved · Updated ${new Date(activeNote.updatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : `Workspace Ready · ${notes.length} Notes`}
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
