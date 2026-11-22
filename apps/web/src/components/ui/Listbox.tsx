import { Check, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { moveActive, typeAhead } from "../../lib/listbox.ts";
import { controlClass } from "./Field.tsx";
import { cx } from "./cx.ts";

export interface ListboxOption {
  value: string;
  label: string;
}

const TYPEAHEAD_RESET_MS = 600;
const POPUP_MAX_HEIGHT = 288;
const EDGE_GAP = 8;

/**
 * A select we style ourselves (the native popup cannot be themed). It follows the ARIA select-only combobox
 * pattern: focus stays on the button, the highlighted option is announced through aria-activedescendant,
 * and the keyboard works as in a native select (arrows, Home/End, Enter/Space, Escape, type-ahead).
 * `id` goes on the button, so a <label htmlFor> focuses it.
 */
export function Listbox({ id, value, options, onChange, placeholder, disabled, className, triggerClassName, "aria-describedby": describedBy, "aria-invalid": invalid }: {
  id: string;
  value: string;
  options: ListboxOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Extra classes for the button itself (the root takes `className`). */
  triggerClassName?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  const base = useId();
  const listId = `${base}-list`;
  const optionId = (i: number) => `${base}-option-${i}`;
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", timer: 0 });
  const selectedIndex = Math.max(options.findIndex((o) => o.value === value), 0);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selectedIndex);
  const [flip, setFlip] = useState(false);

  const show = useCallback(() => {
    if (disabled) return;
    setActive(selectedIndex);
    setOpen(true);
  }, [disabled, selectedIndex]);
  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  };

  // Open upward when there is no room below, so the list is never cut off by the window edge.
  useLayoutEffect(() => {
    if (!open || !root.current) return;
    const rect = root.current.getBoundingClientRect();
    const needed = Math.min(options.length * 40 + 8, POPUP_MAX_HEIGHT);
    setFlip(window.innerHeight - rect.bottom < needed + EDGE_GAP && rect.top > needed + EDGE_GAP);
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  useEffect(() => () => window.clearTimeout(typed.current.timer), []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const { key } = event;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(key)) {
        event.preventDefault();
        show();
      }
      return;
    }
    const moved = moveActive(key, active, options.length);
    if (moved !== null) {
      event.preventDefault();
      setActive(moved);
    } else if (key === "Enter" || key === " ") {
      event.preventDefault();
      choose(active);
    } else if (key === "Escape") {
      event.preventDefault();
      event.stopPropagation(); // do not also close a dialog this listbox sits in
      setOpen(false);
    } else if (key === "Tab") {
      setOpen(false);
    } else if (key.length === 1 && !event.metaKey && !event.ctrlKey) {
      window.clearTimeout(typed.current.timer);
      typed.current.text += key;
      typed.current.timer = window.setTimeout(() => (typed.current.text = ""), TYPEAHEAD_RESET_MS);
      const found = typeAhead(options.map((o) => o.label), typed.current.text, active);
      if (found >= 0) setActive(found);
    }
  };

  const current = options.find((o) => o.value === value);
  return (
    <div ref={root} className={cx("relative", className)}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? optionId(active) : undefined}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={cx(controlClass, "flex items-center justify-between gap-2 text-left", open && "border-link", triggerClassName)}
      >
        <span className={cx("truncate", !current && "text-ink-3")}>{current?.label ?? placeholder ?? ""}</span>
        <ChevronDown aria-hidden size={16} className={cx("shrink-0 text-ink-3 transition-transform duration-150", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          tabIndex={-1}
          className={cx("anim-pop absolute z-30 max-h-72 w-full min-w-40 overflow-y-auto rounded-md border border-line bg-surface p-1 shadow-pop", flip ? "bottom-full mb-1 origin-bottom" : "top-full mt-1 origin-top")}
        >
          {options.map((option, i) => {
            const selected = option.value === value;
            return (
              <li
                key={option.value}
                id={optionId(i)}
                role="option"
                aria-selected={selected}
                onPointerMove={() => setActive(i)}
                onPointerDown={(event) => event.preventDefault() /* keep focus on the button */}
                onClick={() => choose(i)}
                className={cx(
                  "flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-[5px] px-3 text-small transition-colors duration-100",
                  i === active ? "bg-brand-50" : "",
                  selected ? "font-semibold text-link" : "text-ink",
                )}
              >
                <span className="truncate">{option.label}</span>
                {selected && <Check aria-hidden size={16} className="shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
