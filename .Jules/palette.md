## 2024-05-23 - Accessibility Testing in Jest
**Learning:** When testing Obsidian plugins, the `createEl` DOM mock helper in Jest tests must explicitly handle the `options.attr` property to correctly verify accessibility attributes like `aria-label`.
**Action:** Always verify `options.attr` processing logic in test helpers when writing accessibility tests for Obsidian UI components.
