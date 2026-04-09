# Hook: Pre-Flight Check
**Trigger:** Before `/vnr.implement`
**Action:** Warn the user if they have not run `/vnr.analyze` or if there are pending questions from `/vnr.clarify` regarding HR data permissions.

**Agent steps:**
1. Confirm `/vnr.analyze` has been run for the current feature slice (or explicitly waived by the user with rationale).
2. Confirm no open items from `/vnr.clarify` that affect tables, stored procedures, or permission model.
3. If checks fail, stop and list what must be completed before implementation.
