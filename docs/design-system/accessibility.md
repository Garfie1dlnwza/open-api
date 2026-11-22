# Accessibility

- WCAG AA contrast, enforced by a test over every token pair **in both the light and the dark theme**.
- The theme toggle is a button with `aria-pressed`; the first paint already uses the right theme, so there is
  no flash for people sensitive to bright screens.
- The global focus rule lives in the Tailwind base layer, so a utility (for example `-outline-offset-2` inside a dialog
  that clips overflow) can override it. Unlayered CSS beats every layer, which once hid the ring.
- Tables use `<th scope>` for column and row headers and `aria-sort` on the sorted column. The custom select follows
  the ARIA select-only combobox pattern: focus stays on the button, `aria-activedescendant` names the highlighted
  option, and Escape closes it without also closing a dialog it sits in.
- Visible focus ring (2 px brand outline), full keyboard use, native `<dialog>` for modals.
- Every form control has a label; errors use `role="alert"`.
- Status is never colour alone: each status has its own icon shape, and where the icon stands alone it
  has an accessible name (`aria-label`) and a tooltip. Charts add a legend with figures and a table view.
- `prefers-reduced-motion` removes transitions.
- Skip link, landmarks, and `aria-current` on navigation.
- Touch targets: on touch screens (`pointer: coarse`) buttons, tabs, selects, text inputs, `<summary>`
  and navigation links are at least 44 px tall. Mouse layouts keep the denser sizes, but small text links
use the `.tap` utility (32 px, 44 px on touch) so their hit area is larger than their text.
