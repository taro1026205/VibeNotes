import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md bg-[var(--surface)] border-[1.5px] border-[var(--ink)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center border ${
                variant === 'danger'
                  ? 'border-[#ff4444] text-[#ff4444]'
                  : 'border-[var(--ink)] text-[var(--ink)]'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="confirm-dialog-title"
                className="text-xl font-semibold text-[var(--ink)] font-display"
              >
                {title}
              </h2>
              <p className="mt-1.5 text-xs text-[var(--ink-medium)] leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation dialog"
            className="p-1 text-[var(--ink-medium)] hover:text-[var(--ink)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-[0.65rem] font-mono uppercase tracking-wider border border-[var(--ink-faint)] text-[var(--ink)] hover:border-[var(--ink)] transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-[0.65rem] font-mono uppercase tracking-wider font-bold text-white transition-colors cursor-pointer ${
              variant === 'danger'
                ? 'bg-[#ff4444] hover:opacity-90'
                : 'bg-[var(--ink)] text-[var(--bg)] hover:opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
