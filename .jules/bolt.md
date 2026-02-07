## 2025-05-23 - Performance Anti-Patterns in UI Rendering
**Learning:** Parallelizing DOM updates with `Promise.all` can cause race conditions if the order depends on execution timing, even if initial creation is synchronous. Layout thrashing (repeated read/write of layout properties) is a major bottleneck in bulk rendering.
**Action:** When optimizing list rendering, use sequential loops to guarantee order, but batch layout reads (like `scrollTop`) to the end by passing a flag (e.g., `shouldScroll: false`) to individual render functions.
