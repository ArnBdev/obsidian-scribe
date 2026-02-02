## 2025-02-02 - Message Formatting Optimization
**Learning:** String manipulation inside render loops (like `split/join` for every line) is a performance killer in chat interfaces. Also, duplicated logic between static display and streaming updates leads to bugs (like inconsistent table rendering).
**Action:** Always extract complex formatting logic into a pure function. Use fast-path checks (`line.includes('|')`) before running expensive regex operations. Fix logic bugs (like table termination) while optimizing.
