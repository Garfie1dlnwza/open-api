import type { ReactNode } from "react";

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      {icon && <div className="text-ink-3">{icon}</div>}
      <h3 className="text-h4 font-semibold text-ink">{title}</h3>
      {children && <p className="max-w-md text-small text-ink-2">{children}</p>}
      {action}
    </div>
  );
}
