import { useEffect, useRef, type ReactNode } from "react";

/** Thin wrapper over the native <dialog>: focus trap, Esc and backdrop come from the browser. */
export function Dialog({ open, onClose, title, children, labelledBy }: { open: boolean; onClose: () => void; title: string; children: ReactNode; labelledBy: string }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      className="m-auto w-[min(92vw,30rem)] rounded-xl border border-line bg-surface p-0 text-ink shadow-pop backdrop:bg-brand-900/40"
    >
      <div className="flex flex-col gap-4 p-6">
        <h2 id={labelledBy} className="text-h3 font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
