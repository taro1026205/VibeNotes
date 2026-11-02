import React, { useEffect } from 'react';
import { Info, Keyboard, X } from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from '../utils/notesLogic';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const workspaceShortcuts = KEYBOARD_SHORTCUTS.filter(
    (s) => s.category === 'workspace'
  );
  const editorShortcuts = KEYBOARD_SHORTCUTS.filter(
    (s) => s.category === 'editor'
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      data-testid="shortcuts-info-modal"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[88dvh] flex flex-col bg-[var(--surface)] border-[1.5px] border-[var(--ink)] shadow-[6px_6px_0px_var(--ink)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b-[1.5px] border-[var(--ink)] bg-[var(--bg)] flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--ink)] bg-[var(--surface)] text-[var(--ink)]">
              <Info className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="shortcuts-modal-title"
                  className="text-xl sm:text-2xl font-semibold text-[var(--ink)] font-display leading-tight"
                >
                  Keyboard Shortcuts Cheat-Sheet
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-[var(--ink-medium)]">
                Quick reference for navigating VibeNotes, managing notes, and authoring Markdown.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts modal"
            className="p-1.5 border border-transparent hover:border-[var(--ink)] text-[var(--ink-medium)] hover:text-[var(--ink)] transition-colors cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto smooth-touch-scroll grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Section 1: Workspace & Note Actions */}
          <section aria-labelledby="shortcuts-workspace-heading">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--ink-faint)]">
              <h3
                id="shortcuts-workspace-heading"
                className="editorial-label !text-[0.68rem] !text-[var(--ink)] font-bold flex items-center gap-1.5"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Workspace &amp; Common Tasks</span>
              </h3>
              <span className="editorial-label !text-[0.58rem]">
                Global
              </span>
            </div>

            <div className="divide-y divide-[var(--ink-faint)] border border-[var(--ink-faint)] bg-[var(--bg)]/40">
              {workspaceShortcuts.map((item) => (
                <div
                  key={item.id}
                  className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-[var(--bg)] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--ink)]">
                      {item.label}
                    </div>
                    <div className="text-[0.68rem] text-[var(--ink-medium)] leading-snug">
                      {item.description}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <kbd className="px-2 py-1 text-[0.65rem] font-mono font-bold bg-[var(--surface)] text-[var(--ink)] border border-[var(--ink)] shadow-[2px_2px_0px_var(--ink)] whitespace-nowrap">
                      {item.keys}
                    </kbd>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Markdown Editor & History */}
          <section aria-labelledby="shortcuts-editor-heading">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--ink-faint)]">
              <h3
                id="shortcuts-editor-heading"
                className="editorial-label !text-[0.68rem] !text-[var(--ink)] font-bold"
              >
                Markdown Formatting &amp; History
              </h3>
              <span className="editorial-label !text-[0.58rem]">
                Editor
              </span>
            </div>

            <div className="divide-y divide-[var(--ink-faint)] border border-[var(--ink-faint)] bg-[var(--bg)]/40">
              {editorShortcuts.map((item) => (
                <div
                  key={item.id}
                  className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-[var(--bg)] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--ink)]">
                      {item.label}
                    </div>
                    <div className="text-[0.68rem] text-[var(--ink-medium)] leading-snug">
                      {item.description}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <kbd className="px-2 py-1 text-[0.65rem] font-mono font-bold bg-[var(--surface)] text-[var(--ink)] border border-[var(--ink)] shadow-[2px_2px_0px_var(--ink)] whitespace-nowrap">
                      {item.keys}
                    </kbd>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t-[1.5px] border-[var(--ink)] bg-[var(--bg)] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <span className="editorial-label !text-[0.6rem]">
            Tip: Press <kbd className="px-1 py-0.5 border border-[var(--ink-faint)] bg-[var(--surface)] text-[var(--ink)]">Cmd/Ctrl + /</kbd> or <kbd className="px-1 py-0.5 border border-[var(--ink-faint)] bg-[var(--surface)] text-[var(--ink)]">?</kbd> anytime to toggle this sheet
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-[0.65rem] font-mono uppercase tracking-wider font-bold bg-[var(--ink)] text-[var(--bg)] hover:opacity-90 transition-opacity cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
