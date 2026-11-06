import { marked } from 'marked';

export type TagColor = string;

export interface NoteTag {
  id: TagColor;
  label: string;
  dotClass: string;
  activeTextClass: string;
  isCustom?: boolean;
}

export const TAG_CATEGORIES: NoteTag[] = [
  {
    id: 'indigo',
    label: 'Engineering',
    dotClass: 'bg-indigo-500',
    activeTextClass: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'emerald',
    label: 'Personal',
    dotClass: 'bg-emerald-500',
    activeTextClass: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'amber',
    label: 'Ideas',
    dotClass: 'bg-amber-500',
    activeTextClass: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'rose',
    label: 'Urgent',
    dotClass: 'bg-rose-500',
    activeTextClass: 'text-rose-600 dark:text-rose-400',
  },
  {
    id: 'sky',
    label: 'Research',
    dotClass: 'bg-sky-500',
    activeTextClass: 'text-sky-600 dark:text-sky-400',
  },
];

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tag: TagColor;
  pinned: boolean;
  updatedAt: string;
  createdAt: string;
  keepResourceName?: string;
}

export const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'note-arch-2026',
    title: 'Q4 Product Architecture & Design System',
    content: `# Q4 Product Architecture & Design System

Welcome to **VibeNotes**, a distraction-free workspace combining crisp Markdown authoring with instant local persistence and **Google Keep** synchronization.

## Core Design Principles

1. **Zero-Latency Local Storage**: Every keystroke is persisted immediately to \`localStorage\`.
2. **Typography First**: Built with *Cormorant Garamond* for structural headings, *DM Sans* for long-form reading, and *Space Mono* for code and metrics.
3. **Structured Categorization**: Pin priority notes to the top, create custom filters, or move notes across filters effortlessly.

### Key Milestones

- [x] Finalize two-pane responsive layout
- [x] Integrate live Markdown parser with side-by-side split view
- [x] Connect Google Keep API (\`keep.googleapis.com/v1/notes\`) with confirmation safeguards
- [ ] Conduct Q4 design critique and latency audit

\`\`\`typescript
interface SyncStatus {
  provider: 'localStorage' | 'google-keep';
  encrypted: boolean;
  latencyMs: number;
}
\`\`\`

## Split-View Scroll Synchronization

When working in **Split** mode, scrolling either the **Markdown Editor** (left) or the **Live Preview** (right) proportionally scrolls the opposite pane in real time:

- **Bidirectional Ratio Mapping**: Calculates scroll progress percentage \`scrollTop / (scrollHeight - clientHeight)\` and maps it to the companion pane.
- **Zero Feedback Loops**: Uses an active scroll source lock so programmatic scroll updates never trigger recursive bounce events.

### Performance Targets

| Metric | Target | Current |
| :--- | :--- | :--- |
| Local Save Latency | \`< 2ms\` | \`0.4ms\` |
| Split Scroll Sync Frame Time | \`< 16ms\` | \`1.2ms\` |
| Markdown Parse Time | \`< 5ms\` | \`0.8ms\` |

> "Simplicity is about subtracting the obvious and adding the meaningful." — John Maeda`,
    tag: 'indigo',
    pinned: true,
    createdAt: '2026-10-28T09:30:00.000Z',
    updatedAt: '2026-11-02T10:15:00.000Z',
  },
  {
    id: 'note-keep-sync',
    title: 'Google Keep Workspace Sync Guide',
    content: `# Google Keep Integration Notes

You can link your Google account via the **Google Keep** panel in the top bar to view, push, or manage notes via the official Google Keep REST API.

## Supported Operations

* **List Keep Notes**: Fetches notes from \`https://keep.googleapis.com/v1/notes\`.
* **Push to Google Keep**: Exports the currently active Markdown note as a structured text note in Google Keep.
* **Delete Keep Note**: Permanently deletes a synced note from Google Keep after explicit confirmation.

### Enterprise Scope Note

Google Keep's REST API (\`https://www.googleapis.com/auth/keep\`) is provisioned for Google Workspace Enterprise domains. If you sign in with a standard consumer \`@gmail.com\` account and encounter a scope restriction, you can still use **Import / Export Keep JSON** or test the live API connection directly from the sync drawer.`,
    tag: 'sky',
    pinned: true,
    createdAt: '2026-10-30T14:20:00.000Z',
    updatedAt: '2026-11-01T18:45:00.000Z',
  },
  {
    id: 'note-reading-list',
    title: 'Autumn Reading & Essay Notes',
    content: `# Autumn Reading List

A curated list of books and essays on software craft, architecture, and cognitive ergonomics.

## Currently Reading

1. **The Timeless Way of Building** — *Christopher Alexander*
   Focuses on organic pattern languages and how spaces adapt to their inhabitants.
2. **Designing Data-Intensive Applications** — *Martin Kleppmann*
   Deep dive into consensus, replication logs, and local-first state CRDTs.

## Key Takeaways

| Concept | Application in VibeNotes | Impact |
| :--- | :--- | :--- |
| Local-First State | Instant \`localStorage\` writes | 0ms perceived save latency |
| Visual Hierarchy | High-contrast surfaces | Reduced eye strain |
| Explicit Mutations | Confirmation modal before cloud changes | Zero accidental data loss |`,
    tag: 'amber',
    pinned: false,
    createdAt: '2026-10-24T11:00:00.000Z',
    updatedAt: '2026-11-02T09:10:00.000Z',
  },
  {
    id: 'note-sprint-checklist',
    title: 'Weekly Release Readiness Checklist',
    content: `# Release Readiness Checklist

Before cutting the weekly production release, verify the following items:

- Verify keyboard shortcuts (\`Cmd/Ctrl + K\` for search, \`Cmd/Ctrl + B\` for bold)
- Audit light and dark theme contrast ratios across all surfaces
- Confirm Markdown tables, blockquotes, and code blocks render cleanly
- Export backup snapshot before running migrations`,
    tag: 'rose',
    pinned: false,
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-27T12:00:00.000Z',
  },
];

export type NoteSortOption = 'pinned' | 'dateModified' | 'title';

export interface NoteSortMetadata {
  id: NoteSortOption;
  label: string;
}

export const NOTE_SORT_OPTIONS: NoteSortMetadata[] = [
  { id: 'dateModified', label: 'Date Modified' },
  { id: 'title', label: 'Title' },
  { id: 'pinned', label: 'Pinned' },
];

/**
 * Sorts a list of notes according to the selected NoteSortOption:
 * - 'pinned': Pinned notes first, then by updatedAt descending
 * - 'dateModified': Strictly by updatedAt descending (most recently modified first)
 * - 'title': Alphabetically A-Z by note title (case-insensitive, numeric-aware)
 */
export function sortNotesByOption(
  notes: NoteItem[],
  sortBy: NoteSortOption = 'pinned'
): NoteItem[] {
  return [...notes].sort((a, b) => {
    if (sortBy === 'title') {
      const titleA = (a.title || 'Untitled Note').trim();
      const titleB = (b.title || 'Untitled Note').trim();
      const cmp = titleA.localeCompare(titleB, undefined, {
        sensitivity: 'base',
        numeric: true,
      });
      if (cmp !== 0) return cmp;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }

    if (sortBy === 'dateModified') {
      const timeDiff =
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (timeDiff !== 0) return timeDiff;
      return (a.title || '').localeCompare(b.title || '', undefined, {
        sensitivity: 'base',
        numeric: true,
      });
    }

    // Default 'pinned': pinned notes first, then by updatedAt descending
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

/**
 * Returns tag metadata for a given TagColor from provided filters list (or default TAG_CATEGORIES)
 */
export function getTagMetadata(
  tag: TagColor,
  allFilters: NoteTag[] = TAG_CATEGORIES
): NoteTag {
  return (
    allFilters.find((t) => t.id === tag) || {
      id: tag,
      label: tag.charAt(0).toUpperCase() + tag.slice(1),
      dotClass: 'bg-indigo-500',
      activeTextClass: 'text-indigo-600 dark:text-indigo-400',
      isCustom: true,
    }
  );
}

/**
 * Creates a new custom filter and appends it to existingFilters if not already present.
 */
export function createCustomFilter(
  existingFilters: NoteTag[],
  rawLabel: string
): {
  updatedFilters: NoteTag[];
  createdFilter: NoteTag | null;
  error?: string;
} {
  const label = rawLabel.trim();
  if (!label) {
    return {
      updatedFilters: existingFilters,
      createdFilter: null,
      error: 'Filter name cannot be empty.',
    };
  }

  const duplicate = existingFilters.find(
    (f) => f.label.toLowerCase() === label.toLowerCase()
  );
  if (duplicate) {
    return {
      updatedFilters: existingFilters,
      createdFilter: duplicate,
      error: `Filter "${duplicate.label}" already exists.`,
    };
  }

  const slug =
    'filter-' +
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Math.random().toString(36).slice(2, 5);

  const createdFilter: NoteTag = {
    id: slug,
    label,
    dotClass: 'bg-indigo-500',
    activeTextClass: 'text-indigo-600 dark:text-indigo-400',
    isCustom: true,
  };

  return {
    updatedFilters: [...existingFilters, createdFilter],
    createdFilter,
  };
}

/**
 * Deletes any filter (preset or custom) and reassigns notes that belonged to it
 * to the first remaining filter (or '' if no filters remain).
 */
export function deleteFilterFromList(
  existingFilters: NoteTag[],
  notes: NoteItem[],
  filterIdToRemove: TagColor
): {
  updatedFilters: NoteTag[];
  updatedNotes: NoteItem[];
} {
  const updatedFilters = existingFilters.filter((f) => f.id !== filterIdToRemove);
  const fallbackTag = updatedFilters.length > 0 ? updatedFilters[0].id : '';

  const updatedNotes = notes.map((note) =>
    note.tag === filterIdToRemove ? { ...note, tag: fallbackTag } : note
  );

  return {
    updatedFilters,
    updatedNotes,
  };
}

/**
 * Moves a note (by noteId) to a target filter (targetFilterId) and updates its timestamp.
 */
export function moveNoteToFilter(
  notes: NoteItem[],
  noteId: string,
  targetFilterId: TagColor
): NoteItem[] {
  const now = new Date().toISOString();
  return notes.map((note) =>
    note.id === noteId
      ? { ...note, tag: targetFilterId, updatedAt: now }
      : note
  );
}

/**
 * Filters and sorts notes:
 * - Filters by searchQuery (matching title, content, or filter label, case-insensitive)
 * - Filters by selectedTag ('all' or specific TagColor)
 * - Sorts according to sortBy ('pinned' | 'dateModified' | 'title', default 'pinned')
 */
export function filterAndSortNotes(
  notes: NoteItem[],
  searchQuery: string,
  selectedTag: TagColor | 'all',
  allFilters: NoteTag[] = TAG_CATEGORIES,
  sortBy: NoteSortOption = 'pinned'
): NoteItem[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filtered = notes.filter((note) => {
    const matchesTag = selectedTag === 'all' || note.tag === selectedTag;
    if (!matchesTag) return false;

    if (!normalizedQuery) return true;
    const inTitle = note.title.toLowerCase().includes(normalizedQuery);
    const inContent = note.content.toLowerCase().includes(normalizedQuery);
    const tagLabel = getTagMetadata(note.tag, allFilters).label.toLowerCase();
    const inTag = tagLabel.includes(normalizedQuery);
    return inTitle || inContent || inTag;
  });

  return sortNotesByOption(filtered, sortBy);
}

/**
 * Computes word count, character count, and estimated reading time in minutes
 */
export function computeNoteMetrics(content: string): {
  words: number;
  characters: number;
  lines: number;
  readingTimeMin: number;
} {
  const trimmed = content.trim();
  const characters = content.length;
  const lines = content.length === 0 ? 1 : content.split(/\r\n|\r|\n/).length;
  const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  const readingTimeMin = words === 0 ? 0 : Math.max(1, Math.ceil(words / 200));

  return { words, characters, lines, readingTimeMin };
}

/**
 * Extracts a clean 1-line plain text snippet from Markdown content,
 * stripping leading H1 heading lines so card snippets don't repeat the note title,
 * and preserving hyphenated words.
 */
export function extractPlainTextSnippet(markdown: string, maxLength = 96): string {
  const withoutLeadingH1 = markdown.trimStart().replace(/^#\s+[^\n]+\n*/, '');
  const source = withoutLeadingH1.trim() ? withoutLeadingH1 : markdown;

  const cleaned = source
    .replace(/^#+\s+/gm, '')
    .replace(/^\s*[-*+]\s+(\[[ xX]\]\s+)?/gm, '')
    .replace(/^\s*>\s+/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'No additional content...';
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Renders Markdown string to HTML safely using marked
 */
export function renderMarkdownToHtml(markdown: string): string {
  if (!markdown.trim()) {
    return '<p class="text-[var(--ink-medium)] italic">Nothing to preview yet. Start typing Markdown in the editor...</p>';
  }
  const rawHtml = marked.parse(markdown, { async: false, gfm: true, breaks: true }) as string;
  return rawHtml;
}

/**
 * Creates a new NoteItem with defaults
 */
export function createNewNoteItem(partial?: Partial<NoteItem>): NoteItem {
  const now = new Date().toISOString();
  return {
    id: partial?.id || `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: partial?.title ?? 'Untitled Note',
    content: partial?.content ?? '# Untitled Note\n\nStart writing in Markdown...',
    tag: partial?.tag ?? 'indigo',
    pinned: partial?.pinned ?? false,
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    keepResourceName: partial?.keepResourceName,
  };
}

/**
 * Pure helper that inserts Markdown formatting around a selection (or default text)
 * and computes the next cursor selection range.
 */
export function applyMarkdownInsertion(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix = '',
  defaultText = 'text'
): {
  updatedContent: string;
  nextSelectionStart: number;
  nextSelectionEnd: number;
} {
  const safeStart = Math.max(0, Math.min(selectionStart, content.length));
  const safeEnd = Math.max(safeStart, Math.min(selectionEnd, content.length));
  const selectedText = content.slice(safeStart, safeEnd) || defaultText;

  const updatedContent =
    content.slice(0, safeStart) +
    prefix +
    selectedText +
    suffix +
    content.slice(safeEnd);

  const nextSelectionStart = safeStart + prefix.length;
  const nextSelectionEnd = nextSelectionStart + selectedText.length;

  return {
    updatedContent,
    nextSelectionStart,
    nextSelectionEnd,
  };
}

export interface MarkdownSuggestion {
  id: string;
  label: string;
  syntax: string;
  description: string;
  insertText: string;
  cursorBacktrack?: number;
}

export const MARKDOWN_SNIPPETS: MarkdownSuggestion[] = [
  {
    id: 'h1',
    label: 'Heading 1',
    syntax: '# ',
    description: 'Large section title',
    insertText: '# ',
  },
  {
    id: 'h2',
    label: 'Heading 2',
    syntax: '## ',
    description: 'Medium section heading',
    insertText: '## ',
  },
  {
    id: 'h3',
    label: 'Heading 3',
    syntax: '### ',
    description: 'Subsection heading',
    insertText: '### ',
  },
  {
    id: 'bullet',
    label: 'Bullet List',
    syntax: '- ',
    description: 'Unordered list item',
    insertText: '- ',
  },
  {
    id: 'task',
    label: 'Task Checklist',
    syntax: '- [ ] ',
    description: 'Interactive to-do item',
    insertText: '- [ ] ',
  },
  {
    id: 'numbered',
    label: 'Numbered List',
    syntax: '1. ',
    description: 'Ordered list item',
    insertText: '1. ',
  },
  {
    id: 'quote',
    label: 'Blockquote',
    syntax: '> ',
    description: 'Editorial callout quote',
    insertText: '> ',
  },
  {
    id: 'codeblock',
    label: 'Code Block',
    syntax: '```ts',
    description: 'Fenced code snippet',
    insertText: '```typescript\n\n```',
    cursorBacktrack: 4,
  },
  {
    id: 'table',
    label: 'Markdown Table',
    syntax: '| Col |',
    description: '2-column structured table',
    insertText: '| Column 1 | Column 2 |\n| :--- | :--- |\n| Value 1 | Value 2 |',
  },
  {
    id: 'divider',
    label: 'Horizontal Divider',
    syntax: '---',
    description: 'Section separator rule',
    insertText: '---\n',
  },
];

export interface ActiveAutocompleteContext {
  triggerStart: number;
  triggerEnd: number;
  query: string;
  suggestions: MarkdownSuggestion[];
}

/**
 * Computes contextual Markdown auto-completion suggestions based on the current
 * line and cursor position (supports both prefix triggers like '#', '-', '>', '`'
 * at the start of a line and slash commands like '/h1', '/list', '/task' anywhere).
 */
export function getMarkdownAutocompleteSuggestions(
  content: string,
  cursorPosition: number
): ActiveAutocompleteContext | null {
  const safeCursor = Math.max(0, Math.min(cursorPosition, content.length));
  const beforeCursor = content.slice(0, safeCursor);
  const lastNewline = beforeCursor.lastIndexOf('\n');
  const lineStart = lastNewline + 1;
  const currentLineBeforeCursor = beforeCursor.slice(lineStart);

  // 1. Slash command trigger (e.g., "/h", "/list", "/" at start of line or after space)
  const slashMatch = currentLineBeforeCursor.match(/(?:^|\s)(\/[a-zA-Z0-9_-]*)$/);
  if (slashMatch) {
    const token = slashMatch[1];
    const query = token.slice(1).toLowerCase();
    const triggerStart = safeCursor - token.length;
    const matches = MARKDOWN_SNIPPETS.filter(
      (item) =>
        !query ||
        item.id.includes(query) ||
        item.label.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
    if (matches.length > 0) {
      return {
        triggerStart,
        triggerEnd: safeCursor,
        query: token,
        suggestions: matches.slice(0, 6),
      };
    }
  }

  // 2. Line-start Markdown prefix triggers ('#', '##', '-', '1', '>', '``')
  const trimmedLine = currentLineBeforeCursor.trimStart();
  const leadingSpaces = currentLineBeforeCursor.length - trimmedLine.length;
  const tokenStart = lineStart + leadingSpaces;

  if (/^#{1,3}$/.test(trimmedLine)) {
    return {
      triggerStart: tokenStart,
      triggerEnd: safeCursor,
      query: trimmedLine,
      suggestions: MARKDOWN_SNIPPETS.filter((s) => s.id.startsWith('h')),
    };
  }

  if (/^[-*]$/.test(trimmedLine) || /^-\s*\[?$/.test(trimmedLine)) {
    return {
      triggerStart: tokenStart,
      triggerEnd: safeCursor,
      query: trimmedLine,
      suggestions: MARKDOWN_SNIPPETS.filter((s) =>
        ['bullet', 'task', 'divider'].includes(s.id)
      ),
    };
  }

  if (/^[1-9]\.?$/.test(trimmedLine)) {
    return {
      triggerStart: tokenStart,
      triggerEnd: safeCursor,
      query: trimmedLine,
      suggestions: MARKDOWN_SNIPPETS.filter((s) =>
        ['numbered', 'task', 'bullet'].includes(s.id)
      ),
    };
  }

  if (trimmedLine === '>') {
    return {
      triggerStart: tokenStart,
      triggerEnd: safeCursor,
      query: trimmedLine,
      suggestions: MARKDOWN_SNIPPETS.filter((s) => s.id === 'quote'),
    };
  }

  if (/^`{1,2}$/.test(trimmedLine)) {
    return {
      triggerStart: tokenStart,
      triggerEnd: safeCursor,
      query: trimmedLine,
      suggestions: MARKDOWN_SNIPPETS.filter((s) => s.id === 'codeblock'),
    };
  }

  return null;
}

/**
 * Applies a chosen MarkdownSuggestion at the active trigger range.
 */
export function applyAutocompleteSuggestion(
  content: string,
  context: ActiveAutocompleteContext,
  suggestion: MarkdownSuggestion
): {
  updatedContent: string;
  nextCursorPosition: number;
} {
  const before = content.slice(0, context.triggerStart);
  const after = content.slice(context.triggerEnd);
  const updatedContent = before + suggestion.insertText + after;
  const backtrack = suggestion.cursorBacktrack || 0;
  const nextCursorPosition =
    before.length + suggestion.insertText.length - backtrack;

  return {
    updatedContent,
    nextCursorPosition,
  };
}

/**
 * Computes the proportional scrollTop for a target scrollable element based on a source element's scroll position.
 */
export function computeSyncedScrollTop(
  sourceScrollTop: number,
  sourceScrollHeight: number,
  sourceClientHeight: number,
  targetScrollHeight: number,
  targetClientHeight: number
): number {
  const sourceMaxScroll = Math.max(0, sourceScrollHeight - sourceClientHeight);
  const targetMaxScroll = Math.max(0, targetScrollHeight - targetClientHeight);

  if (sourceMaxScroll <= 0 || targetMaxScroll <= 0) {
    return 0;
  }

  const ratio = Math.min(1, Math.max(0, sourceScrollTop / sourceMaxScroll));
  return Math.round(ratio * targetMaxScroll);
}

/**
 * Generates a clean, safe .pdf filename from a note title.
 */
export function formatPdfFilename(title: string): string {
  const base = (title || 'untitled-note')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${base || 'untitled-note'}.pdf`;
}

/**
 * Builds structured editorial HTML for PDF export of a note.
 */
export function buildPrintableNoteHtml(
  note: NoteItem,
  filterLabel: string
): string {
  const metrics = computeNoteMetrics(note.content);
  const renderedBody = renderMarkdownToHtml(note.content);
  const formattedDate = new Date(note.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const safeTitle = (note.title || 'Untitled Note')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `
    <div style="font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; color: #1a1a1a; background: #ffffff; padding: 40px 48px; width: 794px; box-sizing: border-box;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 24px; font-family: 'Space Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #555555;">
        <span>VibeNotes · ${filterLabel || 'All'}</span>
        <span>${formattedDate} · ${metrics.words} Words · ~${metrics.readingTimeMin} Min Read</span>
      </div>
      <h1 style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 34px; font-weight: 600; line-height: 1.2; margin: 0 0 24px 0; color: #1a1a1a;">
        ${safeTitle}
      </h1>
      <div class="markdown-preview" style="font-size: 14px; line-height: 1.75; color: #1a1a1a;">
        ${renderedBody}
      </div>
    </div>
  `.trim();
}

export interface EditorHistoryEntry {
  content: string;
  selectionStart: number;
  selectionEnd: number;
}

export interface EditorHistoryState {
  past: EditorHistoryEntry[];
  present: EditorHistoryEntry;
  future: EditorHistoryEntry[];
}

/**
 * Creates an initial Undo/Redo history state for a note's Markdown content.
 */
export function createInitialHistoryState(
  content: string,
  selectionStart = content.length,
  selectionEnd = content.length
): EditorHistoryState {
  return {
    past: [],
    present: { content, selectionStart, selectionEnd },
    future: [],
  };
}

/**
 * Pushes a new content snapshot onto the Undo history stack and clears Redo future.
 */
export function pushEditorHistory(
  state: EditorHistoryState,
  nextEntry: EditorHistoryEntry,
  maxHistory = 100
): EditorHistoryState {
  if (state.present.content === nextEntry.content) {
    return {
      ...state,
      present: nextEntry,
    };
  }
  const nextPast = [...state.past, state.present].slice(-maxHistory);
  return {
    past: nextPast,
    present: nextEntry,
    future: [],
  };
}

/**
 * Steps backward one entry in the editor history stack (Undo).
 */
export function undoEditorHistory(state: EditorHistoryState): {
  nextState: EditorHistoryState;
  restored: EditorHistoryEntry | null;
} {
  if (state.past.length === 0) {
    return { nextState: state, restored: null };
  }
  const previous = state.past[state.past.length - 1];
  const newPast = state.past.slice(0, -1);
  return {
    nextState: {
      past: newPast,
      present: previous,
      future: [state.present, ...state.future],
    },
    restored: previous,
  };
}

/**
 * Steps forward one entry in the editor history stack (Redo).
 */
export function redoEditorHistory(state: EditorHistoryState): {
  nextState: EditorHistoryState;
  restored: EditorHistoryEntry | null;
} {
  if (state.future.length === 0) {
    return { nextState: state, restored: null };
  }
  const next = state.future[0];
  const newFuture = state.future.slice(1);
  return {
    nextState: {
      past: [...state.past, state.present],
      present: next,
      future: newFuture,
    },
    restored: next,
  };
}

export type ShortcutCategory = 'workspace' | 'editor';

export interface ShortcutInfoItem {
  id: string;
  category: ShortcutCategory;
  label: string;
  description: string;
  keys: string;
  macKeys: string;
}

export const KEYBOARD_SHORTCUTS: ShortcutInfoItem[] = [
  {
    id: 'new-note',
    category: 'workspace',
    label: 'Create a new note',
    description: 'Creates a fresh Markdown note in the current filter and focuses it',
    keys: 'Cmd/Ctrl + N',
    macKeys: '⌘ + N',
  },
  {
    id: 'switch-view',
    category: 'workspace',
    label: 'Switch editor view',
    description: 'Cycles through Edit → Split → Preview modes',
    keys: 'Cmd/Ctrl + E',
    macKeys: '⌘ + E',
  },
  {
    id: 'pin-note',
    category: 'workspace',
    label: 'Pin or unpin active note',
    description: 'Pins the current note to the top of the sidebar list',
    keys: 'Cmd/Ctrl + P',
    macKeys: '⌘ + P',
  },
  {
    id: 'focus-search',
    category: 'workspace',
    label: 'Search notes',
    description: 'Focuses the Title / Content / Filter search bar',
    keys: 'Cmd/Ctrl + K',
    macKeys: '⌘ + K',
  },
  {
    id: 'open-shortcuts',
    category: 'workspace',
    label: 'Keyboard shortcuts cheat-sheet',
    description: 'Opens or closes this keyboard shortcuts info modal',
    keys: 'Cmd/Ctrl + /',
    macKeys: '⌘ + /',
  },
  {
    id: 'undo',
    category: 'editor',
    label: 'Undo change',
    description: 'Steps backward in the note editor history stack',
    keys: 'Cmd/Ctrl + Z',
    macKeys: '⌘ + Z',
  },
  {
    id: 'redo',
    category: 'editor',
    label: 'Redo change',
    description: 'Steps forward in the note editor history stack',
    keys: 'Cmd/Ctrl + Y',
    macKeys: '⌘ + Shift + Z',
  },
  {
    id: 'bold',
    category: 'editor',
    label: 'Bold text',
    description: 'Wraps selected text with **bold** Markdown syntax',
    keys: 'Cmd/Ctrl + B',
    macKeys: '⌘ + B',
  },
  {
    id: 'italic',
    category: 'editor',
    label: 'Italic text',
    description: 'Wraps selected text with *italic* Markdown syntax',
    keys: 'Cmd/Ctrl + I',
    macKeys: '⌘ + I',
  },
  {
    id: 'autocomplete',
    category: 'editor',
    label: 'Markdown syntax auto-complete',
    description: 'Opens contextual Markdown command palette at the cursor',
    keys: 'Cmd/Ctrl + Space or /',
    macKeys: '⌘ + Space or /',
  },
];

/**
 * Cycles the editor view mode in order: edit -> split -> preview -> edit
 */
export function cycleEditorViewMode(
  currentMode: 'edit' | 'split' | 'preview'
): 'edit' | 'split' | 'preview' {
  if (currentMode === 'edit') return 'split';
  if (currentMode === 'split') return 'preview';
  return 'edit';
}

export type GlobalShortcutAction =
  | 'new-note'
  | 'cycle-view'
  | 'toggle-pin'
  | 'focus-search'
  | 'toggle-shortcuts-modal'
  | null;

/**
 * Pure resolver that maps a KeyboardEvent-like payload to a global workspace action.
 */
export function resolveGlobalShortcutAction(event: {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  isEditableTarget?: boolean;
}): GlobalShortcutAction {
  if (event.altKey) return null;

  const hasCmdOrCtrl = Boolean(event.metaKey || event.ctrlKey);
  const normalizedKey = (event.key || '').toLowerCase();

  if (hasCmdOrCtrl && !event.shiftKey) {
    if (normalizedKey === 'n') return 'new-note';
    if (normalizedKey === 'e') return 'cycle-view';
    if (normalizedKey === 'p') return 'toggle-pin';
    if (normalizedKey === 'k') return 'focus-search';
    if (event.key === '/' || event.key === '?') return 'toggle-shortcuts-modal';
  }

  if (!hasCmdOrCtrl && !event.isEditableTarget && event.key === '?') {
    return 'toggle-shortcuts-modal';
  }

  return null;
}

export const MAX_NOTE_VERSIONS = 10;

export interface NoteVersionSnapshot {
  id: string;
  noteId: string;
  title: string;
  content: string;
  savedAt: string;
}

export type NoteVersionHistoryMap = Record<string, NoteVersionSnapshot[]>;

/**
 * Returns the saved version history stack for a specific note ID.
 */
export function getNoteVersionStack(
  historyMap: NoteVersionHistoryMap,
  noteId: string
): NoteVersionSnapshot[] {
  return historyMap[noteId] || [];
}

/**
 * Records a previous note state onto the bounded version history stack for that note
 * whenever title or content changes.
 */
export function recordNoteVersionSnapshot(
  historyMap: NoteVersionHistoryMap,
  previousNote: Pick<NoteItem, 'id' | 'title' | 'content'>,
  nextChanges: { title?: string; content?: string },
  maxVersions = MAX_NOTE_VERSIONS
): NoteVersionHistoryMap {
  const nextTitle =
    nextChanges.title !== undefined ? nextChanges.title : previousNote.title;
  const nextContent =
    nextChanges.content !== undefined
      ? nextChanges.content
      : previousNote.content;

  if (
    nextTitle === previousNote.title &&
    nextContent === previousNote.content
  ) {
    return historyMap;
  }

  const existingStack = historyMap[previousNote.id] || [];
  const lastSnapshot =
    existingStack.length > 0 ? existingStack[existingStack.length - 1] : null;

  if (
    lastSnapshot &&
    lastSnapshot.title === previousNote.title &&
    lastSnapshot.content === previousNote.content
  ) {
    return historyMap;
  }

  const snapshot: NoteVersionSnapshot = {
    id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    noteId: previousNote.id,
    title: previousNote.title,
    content: previousNote.content,
    savedAt: new Date().toISOString(),
  };

  const nextStack = [...existingStack, snapshot].slice(-maxVersions);

  return {
    ...historyMap,
    [previousNote.id]: nextStack,
  };
}

/**
 * Pops and returns the most recent previous version snapshot for a note.
 */
export function restorePreviousNoteVersion(
  historyMap: NoteVersionHistoryMap,
  noteId: string
): {
  updatedHistoryMap: NoteVersionHistoryMap;
  restoredSnapshot: NoteVersionSnapshot | null;
} {
  const existingStack = historyMap[noteId] || [];
  if (existingStack.length === 0) {
    return {
      updatedHistoryMap: historyMap,
      restoredSnapshot: null,
    };
  }

  const restoredSnapshot = existingStack[existingStack.length - 1];
  const remainingStack = existingStack.slice(0, -1);

  return {
    updatedHistoryMap: {
      ...historyMap,
      [noteId]: remainingStack,
    },
    restoredSnapshot,
  };
}

export type AuthProviderType = 'email' | 'google' | 'guest';
export type AuthViewMode = 'signin' | 'signup';

export interface WorkspaceUserProfile {
  name: string;
  email: string;
  provider: AuthProviderType;
  signedInAt: string;
  isNewUser?: boolean;
}

export interface RegisteredWorkspaceAccount {
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

/**
 * Derives a clean, human-readable display name from an email address.
 * Example: "hoang.nguyen_106@gmail.com" -> "Hoang Nguyen 106"
 */
export function deriveUserNameFromEmail(email: string): string {
  const trimmed = (email || '').trim();
  if (!trimmed) return 'Guest Writer';

  const localPart = trimmed.split('@')[0] || '';
  const words = localPart
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return 'Guest Writer';

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Validates view-level email & password Sign In inputs and constructs a WorkspaceUserProfile.
 * If the email belongs to a registered local account, verifies the password and uses the saved name.
 */
export function validateEmailLoginInput(
  rawEmail: string,
  rawPassword: string,
  rawDisplayName?: string,
  registeredAccounts: RegisteredWorkspaceAccount[] = []
): {
  ok: boolean;
  profile: WorkspaceUserProfile | null;
  error?: string;
} {
  const email = (rawEmail || '').trim().toLowerCase();
  const password = rawPassword || '';
  const customName = (rawDisplayName || '').trim();

  if (!email) {
    return {
      ok: false,
      profile: null,
      error: 'Please enter your email address.',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      ok: false,
      profile: null,
      error: 'Please enter a valid email address (e.g. name@domain.com).',
    };
  }

  if (password.trim().length < 4) {
    return {
      ok: false,
      profile: null,
      error: 'Password must be at least 4 characters.',
    };
  }

  const matchedAccount = registeredAccounts.find(
    (acc) => acc.email.toLowerCase() === email
  );

  if (matchedAccount && matchedAccount.password !== password) {
    return {
      ok: false,
      profile: null,
      error: 'Incorrect password for this account. Please try again.',
    };
  }

  const resolvedName =
    customName || matchedAccount?.name || deriveUserNameFromEmail(email);

  return {
    ok: true,
    profile: {
      name: resolvedName,
      email,
      provider: 'email',
      signedInAt: new Date().toISOString(),
      isNewUser: false,
    },
  };
}

/**
 * Validates Notion-style Sign Up (New User) inputs, checks for duplicate registered emails,
 * and returns both the new RegisteredWorkspaceAccount and active WorkspaceUserProfile.
 */
export function validateEmailSignUpInput(
  rawFullName: string,
  rawEmail: string,
  rawPassword: string,
  rawConfirmPassword?: string,
  registeredAccounts: RegisteredWorkspaceAccount[] = []
): {
  ok: boolean;
  profile: WorkspaceUserProfile | null;
  registeredAccount: RegisteredWorkspaceAccount | null;
  updatedAccounts: RegisteredWorkspaceAccount[];
  error?: string;
} {
  const fullName = (rawFullName || '').trim();
  const email = (rawEmail || '').trim().toLowerCase();
  const password = rawPassword || '';
  const confirmPassword =
    rawConfirmPassword !== undefined ? rawConfirmPassword : password;

  if (!fullName || fullName.length < 2) {
    return {
      ok: false,
      profile: null,
      registeredAccount: null,
      updatedAccounts: registeredAccounts,
      error: 'Please enter your full name (at least 2 characters).',
    };
  }

  if (!email) {
    return {
      ok: false,
      profile: null,
      registeredAccount: null,
      updatedAccounts: registeredAccounts,
      error: 'Please enter your email address.',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      ok: false,
      profile: null,
      registeredAccount: null,
      updatedAccounts: registeredAccounts,
      error: 'Please enter a valid email address (e.g. name@domain.com).',
    };
  }

  if (password.trim().length < 4) {
    return {
      ok: false,
      profile: null,
      registeredAccount: null,
      updatedAccounts: registeredAccounts,
      error: 'Password must be at least 4 characters.',
    };
  }

  if (password !== confirmPassword) {
    return {
      ok: false,
      profile: null,
      registeredAccount: null,
      updatedAccounts: registeredAccounts,
      error: 'Passwords do not match. Please confirm your password.',
    };
  }

  const existing = registeredAccounts.find(
    (acc) => acc.email.toLowerCase() === email
  );
  if (existing) {
    return {
      ok: false,
      profile: null,
      registeredAccount: null,
      updatedAccounts: registeredAccounts,
      error: 'An account with this email already exists. Please sign in instead.',
    };
  }

  const now = new Date().toISOString();
  const registeredAccount: RegisteredWorkspaceAccount = {
    name: fullName,
    email,
    password,
    createdAt: now,
  };

  return {
    ok: true,
    profile: {
      name: fullName,
      email,
      provider: 'email',
      signedInAt: now,
      isNewUser: true,
    },
    registeredAccount,
    updatedAccounts: [...registeredAccounts, registeredAccount],
  };
}

/**
 * Creates a view-level Google Account user profile for instant sign-in or sign-up.
 */
export function createGoogleDemoUserProfile(
  customEmail?: string,
  customName?: string
): WorkspaceUserProfile {
  const email = (customEmail || '').trim().toLowerCase() || 'nvhoang10605@gmail.com';
  const name =
    (customName || '').trim() ||
    (customEmail ? deriveUserNameFromEmail(email) : 'Hoang Nguyen');

  return {
    name,
    email,
    provider: 'google',
    signedInAt: new Date().toISOString(),
  };
}

export const SAVE_TOAST_DEBOUNCE_MS = 2000;
export const SAVE_TOAST_VISIBLE_MS = 2600;

export interface EditorSaveToastState {
  status: 'idle' | 'typing' | 'saved';
  noteId: string | null;
  savedAt: string | null;
}

/**
 * Returns the initial idle state for the editor's subtle 'Saved' notification toast.
 */
export function createInitialSaveToastState(): EditorSaveToastState {
  return {
    status: 'idle',
    noteId: null,
    savedAt: null,
  };
}

/**
 * Transitions the save toast state when the user types or edits markdown content,
 * hiding any active toast while typing and arming the 2-second debounce window.
 */
export function transitionSaveToastOnEdit(noteId: string): EditorSaveToastState {
  return {
    status: 'typing',
    noteId,
    savedAt: null,
  };
}

/**
 * Transitions the save toast state to 'saved' once the user stops typing for 2 seconds
 * (SAVE_TOAST_DEBOUNCE_MS), verifying the active note still matches.
 */
export function transitionSaveToastOnDebounceComplete(
  currentState: EditorSaveToastState,
  activeNoteId: string | null,
  savedAt = new Date().toISOString()
): EditorSaveToastState {
  if (
    currentState.status !== 'typing' ||
    !activeNoteId ||
    currentState.noteId !== activeNoteId
  ) {
    return currentState;
  }

  return {
    status: 'saved',
    noteId: activeNoteId,
    savedAt,
  };
}

/**
 * Resets the save toast state back to 'idle' after auto-hide or when switching notes.
 */
export function transitionSaveToastOnReset(): EditorSaveToastState {
  return createInitialSaveToastState();
}

export type AccountNotesMap = Record<string, NoteItem[]>;

export const DEMO_WORKSPACE_EMAIL = 'demo@vibenotes.io';

export const DEFAULT_REGISTERED_ACCOUNTS: RegisteredWorkspaceAccount[] = [
  {
    name: 'Demo Evaluator',
    email: DEMO_WORKSPACE_EMAIL,
    password: 'demo1234',
    createdAt: '2026-10-20T08:00:00.000Z',
  },
  {
    name: 'Fresh Student Account',
    email: 'student@vibenotes.io',
    password: 'student1234',
    createdAt: '2026-11-01T08:00:00.000Z',
  },
];

/**
 * Merges saved localStorage accounts with DEFAULT_REGISTERED_ACCOUNTS so the teacher's
 * demo credentials (demo@vibenotes.io / demo1234 and student@vibenotes.io / student1234)
 * always work out-of-the-box on any browser.
 */
export function mergeDefaultRegisteredAccounts(
  storedAccounts: RegisteredWorkspaceAccount[] = []
): RegisteredWorkspaceAccount[] {
  const merged = [...storedAccounts];
  for (const preset of DEFAULT_REGISTERED_ACCOUNTS) {
    const exists = merged.some(
      (acc) => acc.email.trim().toLowerCase() === preset.email.toLowerCase()
    );
    if (!exists) {
      merged.push(preset);
    }
  }
  return merged;
}

/**
 * Normalizes a user email into a consistent localStorage account key.
 */
export function normalizeAccountStorageKey(email?: string | null): string {
  const normalized = (email || '').trim().toLowerCase();
  return normalized || 'anonymous';
}

/**
 * Returns the saved notes array for the given user profile.
 * - Any new account (or any account other than the pre-seeded teacher demo account) starts with [] (0 notes).
 * - Only the dedicated evaluator demo account ('demo@vibenotes.io') is pre-seeded with INITIAL_NOTES if not yet modified.
 */
export function getNotesForAccount(
  accountNotesMap: AccountNotesMap,
  profile: Pick<WorkspaceUserProfile, 'email' | 'isNewUser'> | null
): NoteItem[] {
  if (!profile) return [];
  const key = normalizeAccountStorageKey(profile.email);
  const stored = accountNotesMap[key];
  if (Array.isArray(stored)) {
    return stored;
  }
  if (!profile.isNewUser && key === DEMO_WORKSPACE_EMAIL) {
    return INITIAL_NOTES;
  }
  return [];
}

/**
 * Initializes or retrieves the notes list for an authenticated account.
 * - New accounts (isNewUser === true or any non-demo account logging in for the first time)
 *   always start with an empty notes list ([]).
 * - The dedicated evaluator account ('demo@vibenotes.io') is seeded with INITIAL_NOTES on first sign-in.
 */
export function initializeAccountNotesOnAuth(
  accountNotesMap: AccountNotesMap,
  profile: Pick<WorkspaceUserProfile, 'email' | 'isNewUser'>
): {
  updatedAccountNotesMap: AccountNotesMap;
  accountNotes: NoteItem[];
} {
  const key = normalizeAccountStorageKey(profile.email);
  const existing = accountNotesMap[key];

  if (profile.isNewUser) {
    return {
      updatedAccountNotesMap: {
        ...accountNotesMap,
        [key]: [],
      },
      accountNotes: [],
    };
  }

  if (Array.isArray(existing)) {
    return {
      updatedAccountNotesMap: accountNotesMap,
      accountNotes: existing,
    };
  }

  const initialForAccount = key === DEMO_WORKSPACE_EMAIL ? INITIAL_NOTES : [];
  return {
    updatedAccountNotesMap: {
      ...accountNotesMap,
      [key]: initialForAccount,
    },
    accountNotes: initialForAccount,
  };
}
