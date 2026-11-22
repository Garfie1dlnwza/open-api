import { cx } from "./cx.ts";

/** A shimmering placeholder shaped like the content that is about to arrive. */
export const Skeleton = ({ className }: { className?: string }) => <div aria-hidden className={cx("skeleton", className)} />;
