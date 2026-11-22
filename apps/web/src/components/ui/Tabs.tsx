import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./cx.ts";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

/** All panels stay in the DOM (hidden), so content remains crawlable and copyable without JS state. */
export function Tabs({ items, label, className }: { items: TabItem[]; label: string; className?: string }) {
  const [active, setActive] = useState(items[0]?.id);
  const base = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (event: KeyboardEvent) => {
    const index = items.findIndex((i) => i.id === active);
    const jump = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : null;
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step && jump === null) return;
    event.preventDefault();
    const next = items[jump ?? (index + step + items.length) % items.length];
    setActive(next.id);
    refs.current[next.id]?.focus();
  };

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex gap-1 border-b border-line">
        {items.map((item) => (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[item.id] = el;
            }}
            role="tab"
            type="button"
            id={`${base}-tab-${item.id}`}
            aria-selected={active === item.id}
            aria-controls={`${base}-panel-${item.id}`}
            tabIndex={active === item.id ? 0 : -1}
            onClick={() => setActive(item.id)}
            className={cx(
              "-mb-px h-10 border-b-2 px-3 text-small font-medium transition-colors duration-150",
              active === item.id ? "border-brand-700 text-brand-700" : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${base}-panel-${item.id}`}
          aria-labelledby={`${base}-tab-${item.id}`}
          hidden={active !== item.id}
          className="pt-4"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
