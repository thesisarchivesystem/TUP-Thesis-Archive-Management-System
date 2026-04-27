import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

type ConfirmDialogOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
};

type ConfirmDialogContextValue = {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

type ConfirmDialogState = ConfirmDialogOptions & {
  open: boolean;
};

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const [dialog, setDialog] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'OK',
    cancelLabel: 'Cancel',
    tone: 'default',
  });

  const closeDialog = (value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setDialog((current) => ({ ...current, open: false }));
  };

  const value = useMemo<ConfirmDialogContextValue>(() => ({
    confirm: (options) => new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        open: true,
        title: options.title ?? 'Confirm Action',
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'OK',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        tone: options.tone ?? 'default',
      });
    }),
  }), []);

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      {dialog.open ? (
        <div className="confirm-dialog-overlay" role="presentation" onClick={() => closeDialog(false)}>
          <div
            className="confirm-dialog-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="confirm-dialog-body">
              <h2 id="confirm-dialog-title" className="confirm-dialog-title">{dialog.title}</h2>
              <div className="confirm-dialog-message">
                {dialog.message.split('\n').map((line, index) => (
                  <p key={`${line}-${index}`}>{line || '\u00A0'}</p>
                ))}
              </div>
            </div>
            <div className="confirm-dialog-actions">
              <button
                type="button"
                className={`confirm-dialog-button confirm-dialog-button-confirm${dialog.tone === 'danger' ? ' danger' : ''}`}
                onClick={() => closeDialog(true)}
              >
                {dialog.confirmLabel}
              </button>
              <button
                type="button"
                className="confirm-dialog-button confirm-dialog-button-cancel"
                onClick={() => closeDialog(false)}
              >
                {dialog.cancelLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);

  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider.');
  }

  return context;
}
