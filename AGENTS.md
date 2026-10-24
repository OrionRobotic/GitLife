# AGENTS.md

## Principles
- Minimal changes. Only touch what the task needs.
- Keep it simple: no over-engineering, no speculative abstractions, no new deps unless unavoidable.
- Organized and modular: reuse existing components, services (`src/services/`), and patterns before writing new ones.

## Workflow (autonomous, one loop per feature)
1. **Issue**: from the prompt, open a GitHub issue (`gh issue create`) with a short title and the prompt as the feature description.
2. **Branch**: from up-to-date `main`, create and check out `lz/<issue-number>/<short-slug>`.
3. **Work**: small, focused commits using conventional messages (`feat:`, `fix:`, `chore:`…).
4. **PR**: push and open a PR to `main` titled like the commits (`feat: …`), body says `Closes #<issue-number>`.
5. Follow-ups on the same feature go to the same branch/PR.
6. **New feature**: only when the user explicitly says it's a new feature, squash-merge the current PR into `main` (`gh pr merge --squash --delete-branch`), pull `main`, and restart from step 1.

## Supabase
- Client: `src/lib/supabase.ts` (env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- Schema changes go in `supabase/migrations/<YYYYMMDDHHMMSS>_<name>.sql`, one concern per file.
- Data access lives in `src/services/<domain>/`, one function per file.
