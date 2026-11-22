import { cloneElement, useId, type InputHTMLAttributes, type ReactElement, type SelectHTMLAttributes } from "react";
import { cx } from "./cx.ts";

export const controlClass =
  "h-10 w-full rounded-md border border-control bg-surface px-3 text-small text-ink placeholder:text-ink-3 transition-colors duration-150 hover:border-ink-3 disabled:opacity-60";

/** Label + control + hint/error. The hint and error are wired to the control with aria-describedby. */
export function Field({ label, hint, error, htmlFor, children }: { label: string; hint?: string; error?: string; htmlFor: string; children: ReactElement<{ "aria-describedby"?: string }> }) {
  const base = useId();
  const hintId = `${base}-hint`;
  const errorId = `${base}-error`;
  const describedBy = [error ? errorId : null, hint && !error ? hintId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-small font-medium text-ink">
        {label}
      </label>
      {cloneElement(children, { "aria-describedby": describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-caption text-ink-2">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-caption text-error-fg">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = ({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) => <input className={cx(controlClass, className)} {...rest} />;
export const Select = ({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) => <select className={cx(controlClass, className)} {...rest} />;
