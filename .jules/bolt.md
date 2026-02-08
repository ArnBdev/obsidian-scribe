## 2025-05-18 - [Obsidian Vault Append Optimization]
**Learning:** Using `vault.read()` then `vault.modify()` to append content to a file is an O(N) anti-pattern that scales poorly with file size.
**Action:** Use `vault.append(file, content)` instead for O(1) appending of logs, history, or other sequential data.
