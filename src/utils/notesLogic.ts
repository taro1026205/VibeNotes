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
    updatedAt: '2026-10-29T16:10:00.000Z',
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
 * - Sorts pinned notes first, then by updatedAt descending
 */
export function filterAndSortNotes(
  notes: NoteItem[],
  searchQuery: string,
  selectedTag: TagColor | 'all',
  allFilters: NoteTag[] = TAG_CATEGORIES
): NoteItem[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return notes
    .filter((note) => {
      const matchesTag = selectedTag === 'all' || note.tag === selectedTag;
      if (!matchesTag) return false;

      if (!normalizedQuery) return true;
      const inTitle = note.title.toLowerCase().includes(normalizedQuery);
      const inContent = note.content.toLowerCase().includes(normalizedQuery);
      const tagLabel = getTagMetadata(note.tag, allFilters).label.toLowerCase();
      const inTag = tagLabel.includes(normalizedQuery);
      return inTitle || inContent || inTag;
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
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
