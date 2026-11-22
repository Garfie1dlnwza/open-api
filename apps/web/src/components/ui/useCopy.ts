import { useCallback, useEffect, useRef, useState } from "react";
import { UI } from "../../config/site.ts";

/** Copies text and flips `copied` for a moment so buttons can confirm. Safe when the clipboard is blocked. */
export function useCopy() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), UI.copiedResetMs);
    } catch {
      setCopied(false);
    }
  }, []);

  return { copied, copy };
}
