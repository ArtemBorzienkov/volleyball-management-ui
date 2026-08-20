# AGENTS

Working agreement for AI agents in this repository. This file covers **how to work**;
[`CLAUDE.md`](CLAUDE.md) covers **what this codebase is** — commands, architecture, conventions, and
the parts of the scaffold that are not wired up. Read it before making a change.

Nothing here depends on an external skill or plugin being installed.

## Before writing code

**Read the file before designing against it.** This repo began as a generated scaffold and was
finished unevenly: dependencies are installed but unused, a provider exists but is never mounted, and
five routes still render hardcoded fixtures instead of the API. A reasonable assumption about what is
wired up will frequently be wrong. Open the file.

**Check the data source first.** Before changing anything data-related, confirm whether the route
uses TanStack Query or imports from `@/lib/data`. CLAUDE.md has the per-route table. A "bug" on a
mock-backed page is often just the fixtures.

For anything beyond a one-line fix:

1. Read the files you are about to change, and their callers.
2. Ask about genuine ambiguity, one question at a time — concrete options with a recommendation beat
   open-ended questions.
3. State the design — components touched, data flow, loading and error states — and get agreement
   before writing code. Two sentences is enough for something small.

**Check whether the thing already exists.** Endpoint constants belong in `lib/api.ts`, shared types
in `lib/types.ts`, primitives in `components/ui/`. Adding a parallel copy of any of these is the
common failure here.

## Implementing

**Match the file you are editing.** This codebase is not uniform. Take naming, component shape, and
comment density from the surrounding code rather than from another project's conventions.

**Hooks at the top level, unconditionally.** Never inside a branch, loop, or nested function. A
conditional `useTranslation()` was a live render-order bug in `player-card.tsx`.

**Derive during render before reaching for an effect.** `useEffect` is for real external
synchronisation, not for copying props into state. Do not disable
`react-hooks/exhaustive-deps` to silence a warning.

**Every new user-facing string goes into all four locale files** (`en`, `uk`, `pl`, `be`). A missing
key falls back to English silently, so it will look fine to you and be broken for everyone else.

**New endpoints go in `lib/api.ts`.** Never inline a URL in a component.

**Do not put a secret in a `NEXT_PUBLIC_` variable.** It is inlined into the client bundle and shipped
to every visitor.

**Minimal code to pass.** No speculative props, options, or abstraction for needs nobody has stated.

## Verifying

**Evidence before assertions.** Never report work as done, fixed, or working without having run the
command and read the output. Quote it.

```bash
npx tsc --noEmit    # The only real typecheck — `next build` ignores type errors
npm run lint        # Check YOUR files; the repo carries pre-existing errors
npm run build       # Catches what the others miss
```

**`npx tsc --noEmit` is currently clean. Keep it clean.** A green `next build` proves nothing about
types, because `next.config.mjs` sets `typescript.ignoreBuildErrors: true`.

**Lint has pre-existing debt** — 7 errors and 24 warnings. A non-zero exit is not necessarily your
change. Grep the output for the files you touched instead of reading the total, and never loosen a
rule to make the number go down.

**There is no test framework.** Do not say a change is "tested" — nothing runs. Verify by
typechecking, linting, building, and exercising the affected route in a browser. If a change really
needs automated tests, raise adding a runner as a decision rather than making it silently.

**Check the route, not just the build.** Every page is a client component fetching in the browser, so
compilation success says nothing about whether the page renders or the request succeeds. Load it and
look, including its loading and empty states.

**Report faithfully.** Name what you did not verify and why. If a step was skipped, say so. Never
describe a manual check you did not perform.

## Debugging

Find the cause before proposing a fix. Read the actual error, form a hypothesis, and test it against
the code rather than pattern-matching a plausible fix onto a symptom.

**Suspect the fetch layer for "wrong data" bugs.** No `queryFn` checks `res.ok`, so an HTTP 404 or 500
resolves as a *successful* query whose data is the error body. `isError` stays false and the UI
renders nonsense. A component showing empty or garbled data is often a failing request that TanStack
Query never saw as a failure.

Check the backend too. The API is a sibling directory (`volley-app-service`); when a response looks
wrong, read the endpoint rather than working around it in the UI.

## Boundaries

**Do not run any git command** — no `add`, `commit`, `push`, or `checkout` — unless explicitly asked
in a direct message. This holds even when the work is finished and a commit seems like the obvious
next step.

**Use npm.** The `pnpm-lock.yaml` is stale; `package-lock.json` is current. Do not install with pnpm
and do not regenerate lockfiles as a side effect.

**Do not widen scope.** Fix what was asked. When you spot a real adjacent problem — and this repo has
many — say so and let it be a separate decision instead of folding it in. When part of the requested
scope turns out to be blocked, finish everything else and state plainly what was left out.

**Confirm before destructive or outward-facing actions**, and treat approval for one as approval for
that one only.

## Writing

**Comments: short and essential only.** Explain the *why* the code cannot state — a constraint, a
non-obvious invariant, a deliberate deviation. One or two lines. Never restate the next line.

**Prose: no filler.** Do not pad reports with restatements of the request, and do not claim
significance the work does not have.
