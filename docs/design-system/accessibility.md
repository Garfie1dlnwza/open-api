# Accessibility

- WCAG AA contrast, enforced by a test over every token pair.
- Visible focus ring (2 px brand outline), full keyboard use, native `<dialog>` for modals.
- Every form control has a label; errors use `role="alert"`.
- Status is never colour alone.
- `prefers-reduced-motion` removes transitions.
- Skip link, landmarks, and `aria-current` on navigation.
- Touch targets: controls are 40 px tall; the ⌘K and nav rows have spacing to avoid mis-taps.
  The 44 × 44 px recommendation is not met everywhere yet (small chips are 32 px).
