## 2024-05-22 - Agent View Accessibility

**Learning:** Adding `role="button"` to clickable divs is not enough; you must add `tabindex="0"` and a `keydown` handler for Enter/Space to make them keyboard accessible. Also, `aria-expanded` is crucial for collapsible sections to convey state to screen readers.
**Action:** When implementing collapsible UI patterns in Obsidian plugins, always pair the click handler with a keydown handler and manage `aria-expanded` state.
