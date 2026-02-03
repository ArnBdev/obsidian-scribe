## 2024-05-22 - Obsidian MarkdownRenderer Waterfall
**Learning:** `MarkdownRenderer.render` in Obsidian is async. Sequential calls in a loop create a performance waterfall during bulk updates (like loading history), and accompanying scroll calls cause layout thrashing.
**Action:** Use `Promise.all` to render markdown in parallel (as long as containers are created synchronously to preserve order) and batch DOM layout updates (scrolling) to the end.
