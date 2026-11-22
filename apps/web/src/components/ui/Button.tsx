import { ExternalLink } from "lucide-react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx.ts";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-brand-800 text-on-brand hover:bg-brand-900",
  secondary: "border border-control bg-surface text-ink hover:bg-subtle",
  ghost: "text-ink-2 hover:bg-subtle hover:text-ink",
  destructive: "bg-error-fg text-on-brand hover:opacity-90",
};

export const buttonClass = (variant: ButtonVariant = "primary", extra?: string) =>
  cx(
    "inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-md px-4 text-small font-medium",
    "transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60",
    VARIANT[variant],
    extra,
  );

type CommonProps = { variant?: ButtonVariant; icon?: ReactNode; children?: ReactNode; className?: string };

export function Button({ variant, icon, children, className, ...rest }: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={buttonClass(variant, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

/** `external` opens in a new tab with a trailing icon; the icon lives here because .astro files cannot pass JSX as props. */
export function LinkButton({ variant, icon, children, className, external, ...rest }: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { external?: boolean }) {
  const externalProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <a className={buttonClass(variant, className)} {...externalProps} {...rest}>
      {icon}
      {children}
      {external && <ExternalLink aria-hidden size={14} />}
    </a>
  );
}
