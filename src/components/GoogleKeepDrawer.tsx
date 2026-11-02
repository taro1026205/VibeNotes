import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  X,
  RefreshCw,
  UploadCloud,
  Download,
  Trash2,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  KeepNoteResource,
  listGoogleKeepNotes,
  createGoogleKeepNote,
  deleteGoogleKeepNote,
} from '../services/keepService';
import { NoteItem } from '../utils/notesLogic';
import { ConfirmDialog } from './ConfirmDialog';

interface GoogleKeepDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  needsAuth: boolean;
  isLoggingIn: boolean;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  activeNote: NoteItem | null;
  onImportKeepNote: (title: string, content: string, keepResourceName: string) => void;
  onUpdateActiveNoteKeepResource: (noteId: string, resourceName: string) => void;
}

export const GoogleKeepDrawer: React.FC<GoogleKeepDrawerProps> = ({
  isOpen,
  onClose,
  user,
  needsAuth,
  isLoggingIn,
  onSignIn,
  onSignOut,
  activeNote,
  onImportKeepNote,
  onUpdateActiveNoteKeepResource,
}) => {
  const [keepNotes, setKeepNotes] = useState<KeepNoteResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [pendingAction, setPendingAction] = useState<{
    type: 'push' | 'delete';
    title: string;
    description: string;
    confirmLabel: string;
    variant: 'primary' | 'danger';
    execute: () => Promise<void>;
  } | null>(null);

  if (!isOpen) return null;

  const handleFetchKeepNotes = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const notes = await listGoogleKeepNotes();
      setKeepNotes(notes);
      setStatusMessage({
        type: 'success',
        text: `Loaded ${notes.length} note(s) from Google Keep.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Unable to load Google Keep notes.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const requestPushActiveNote = () => {
    if (!activeNote) return;
    setPendingAction({
      type: 'push',
      title: 'Push Note to Google Keep?',
      description: `This will create a new note titled "${activeNote.title || 'Untitled'}" in your Google Keep account.`,
      confirmLabel: 'Push to Google Keep',
      variant: 'primary',
      execute: async () => {
        setIsLoading(true);
        setStatusMessage(null);
        try {
          const created = await createGoogleKeepNote(
            activeNote.title || 'Untitled Note',
            activeNote.content
          );
          if (created.name) {
            onUpdateActiveNoteKeepResource(activeNote.id, created.name);
          }
          setKeepNotes((prev) => [created, ...prev]);
          setStatusMessage({
            type: 'success',
            text: `Successfully synced "${activeNote.title}" to Google Keep.`,
          });
        } catch (err: any) {
          setStatusMessage({
            type: 'error',
            text: err?.message || 'Failed to create note in Google Keep.',
          });
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const requestDeleteKeepNote = (note: KeepNoteResource) => {
    const displayTitle = note.title || note.name;
    setPendingAction({
      type: 'delete',
      title: 'Delete Note from Google Keep?',
      description: `Are you sure you want to permanently delete "${displayTitle}" from your Google Keep account? This action cannot be undone.`,
      confirmLabel: 'Delete Permanently',
      variant: 'danger',
      execute: async () => {
        setIsLoading(true);
        setStatusMessage(null);
        try {
          await deleteGoogleKeepNote(note.name);
          setKeepNotes((prev) => prev.filter((item) => item.name !== note.name));
          setStatusMessage({
            type: 'success',
            text: `Deleted "${displayTitle}" from Google Keep.`,
          });
        } catch (err: any) {
          setStatusMessage({
            type: 'error',
            text: err?.message || 'Failed to delete Google Keep note.',
          });
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs flex justify-end"
        role="dialog"
        aria-modal="true"
        aria-label="Google Keep Workspace Synchronization"
      >
        <div className="w-full max-w-md bg-[var(--surface)] border-l-[1.5px] border-[var(--ink)] h-full flex flex-col justify-between shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-[var(--ink)] flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--ink)] font-display">
                Google Keep Sync
              </h2>
              <p className="editorial-label mt-1">
                Sync Markdown notes with your Google Keep account
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Google Keep panel"
              className="p-2 text-[var(--ink-medium)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Auth Section */}
            <div className="p-5 border border-[var(--ink)] bg-[var(--bg)]">
              {needsAuth || !user ? (
                <div className="space-y-4">
                  <p className="text-xs text-[var(--ink-medium)] leading-relaxed">
                    Sign in with your Google account to read, create, or delete notes via the Google Keep API.
                  </p>
                  <button
                    type="button"
                    onClick={onSignIn}
                    disabled={isLoggingIn}
                    className="gsi-material-button"
                  >
                    <div className="gsi-material-button-state"></div>
                    <div className="gsi-material-button-content-wrapper">
                      <div className="gsi-material-button-icon">
                        <svg
                          version="1.1"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 48 48"
                          style={{ display: 'block' }}
                        >
                          <path
                            fill="#EA4335"
                            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                          ></path>
                          <path
                            fill="#4285F4"
                            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                          ></path>
                          <path
                            fill="#FBBC05"
                            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                          ></path>
                          <path
                            fill="#34A853"
                            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                          ></path>
                          <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                      </div>
                      <span className="gsi-material-button-contents">
                        {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
                      </span>
                      <span style={{ display: 'none' }}>Sign in with Google</span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--ink)] truncate">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-xs text-[var(--ink-medium)] truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--ink-faint)] text-[0.65rem] font-mono uppercase tracking-wider text-[var(--ink)] hover:border-[var(--ink)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Active Note Push Action */}
            {!needsAuth && user && activeNote && (
              <div className="p-5 border border-[var(--ink-faint)] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="editorial-label">Current Note</span>
                  <span className="text-xs font-medium text-[var(--ink)] truncate max-w-[200px]">
                    {activeNote.title || 'Untitled'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={requestPushActiveNote}
                    disabled={isLoading}
                    className="btn-editorial-primary flex-1 inline-flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Push to Keep
                  </button>
                  <button
                    type="button"
                    onClick={handleFetchKeepNotes}
                    disabled={isLoading}
                    aria-label="Refresh Google Keep notes"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-[var(--ink)] text-[0.7rem] font-mono uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--bg)] disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    Fetch
                  </button>
                </div>
              </div>
            )}

            {/* Status Feedback */}
            {statusMessage && (
              <div className="p-4 border border-[var(--ink)] bg-[var(--bg)] text-xs flex items-start gap-2.5 leading-relaxed">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[var(--ink)]" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#ff4444]" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Keep Notes List */}
            {!needsAuth && user && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="editorial-label">
                    Google Keep Notes ({keepNotes.length})
                  </h3>
                </div>

                {keepNotes.length === 0 ? (
                  <div className="p-6 border border-dashed border-[var(--ink-faint)] text-center">
                    <p className="text-xs text-[var(--ink-medium)]">
                      Click "Fetch" above to load notes from your Google Keep workspace.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {keepNotes.map((kNote) => {
                      const bodyText = kNote.body?.text?.text || '';
                      return (
                        <div
                          key={kNote.name}
                          className="p-4 border border-[var(--ink-faint)] bg-[var(--bg)] flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-[var(--ink)] truncate font-display">
                              {kNote.title || 'Untitled Keep Note'}
                            </h4>
                            <p className="text-xs text-[var(--ink-medium)] line-clamp-2 mt-1">
                              {bodyText || 'Empty text note'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                onImportKeepNote(
                                  kNote.title || 'Imported Keep Note',
                                  bodyText,
                                  kNote.name
                                )
                              }
                              aria-label={`Import ${kNote.title || 'Keep note'} to local workspace`}
                              className="p-1.5 text-[var(--ink-medium)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDeleteKeepNote(kNote)}
                              aria-label={`Delete ${kNote.title || 'Keep note'} from Google Keep`}
                              className="p-1.5 text-[var(--ink-medium)] hover:text-[#ff4444] transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer info */}
          <div className="p-4 border-t border-[var(--ink)] bg-[var(--bg)] editorial-label !text-[0.6rem]">
            All mutating or destructive Google Keep operations require explicit confirmation.
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(pendingAction)}
        title={pendingAction?.title || ''}
        description={pendingAction?.description || ''}
        confirmLabel={pendingAction?.confirmLabel}
        variant={pendingAction?.variant || 'primary'}
        onCancel={() => setPendingAction(null)}
        onConfirm={async () => {
          const action = pendingAction;
          setPendingAction(null);
          if (action) {
            await action.execute();
          }
        }}
      />
    </>
  );
};
