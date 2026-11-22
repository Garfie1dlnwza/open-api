# Accessibility

- WCAG AA contrast, enforced by a test over every token pair.
- Visible focus ring (2 px brand outline), full keyboard use, native `<dialog>` for modals.
- Every form control has a label; errors use `role="alert"`.
- Status is never colour alone: each status has its own icon shape, and where the icon stands alone it
  has an accessible name (`aria-label`) and a tooltip. Charts add a legend with figures and a table view.
- `prefers-reduced-motion` removes transitions.
- Skip link, landmarks, and `aria-current` on navigation.
- Touch targets: on touch screens (`pointer: coarse`) buttons, tabs, selects, text inputs, `<summary>`
  and navigation links are at least 44 px tall. Mouse layouts keep the denser 32-40 px sizes.
