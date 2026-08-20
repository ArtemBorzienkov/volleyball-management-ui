# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The front-end for **SandStats**, a beach-volleyball tournament and statistics platform. It is a
Next.js App Router app that talks to the `volley-app-service` REST API (a sibling directory).
[`AGENTS.md`](AGENTS.md) covers working practice: how to design, verify, and land a change here.

The package is still named `my-v0-project` and `app/layout.tsx` carries a `generator: 'v0.app'`
metadata field — this began as a v0 scaffold, and some of the scaffold is still unfinished. Assume
nothing is wired up until you have read the file.

## Commands

```bash
npm run dev -- -p 3001   # Dev server. Use a non-3000 port: the API hard-codes 3000
npm run build            # Production build
npm start                # Serve the production build
npm run lint             # ESLint (flat config, eslint-config-next)
npx tsc --noEmit         # The ONLY real typecheck — see below
```

**npm only.** A stale `pnpm-lock.yaml` sits next to `package-lock.json`; the npm lockfile is the
current one and `node_modules` was installed by npm. Ignore the pnpm lockfile; do not install with
pnpm.

### `next build` does not typecheck

`next.config.mjs` sets `typescript.ignoreBuildErrors: true`, so a green build says nothing about
types. `tsconfig.json` has `strict: true`, and **`npx tsc --noEmit` is currently clean** — keep it
that way and run it as part of verifying any change. `images.unoptimized: true` is also set, so
`next/image` does no optimization.

## Architecture

### It is a client-side app in App Router clothing

**Every page is `'use client'`.** There are no server components fetching data, no Server Actions,
and no route handlers — `app/layout.tsx` and `app/games/loading.tsx` are the only server files. All
data is fetched in the browser through TanStack Query. Keep to that pattern unless you are
deliberately converting a route, which is a design decision, not an implementation detail.

```
app/                  # Routes, one page.tsx each, all 'use client'
  layout.tsx          # I18nProvider > LayoutWrapper > QueryProvider; mounts Vercel Analytics
  globals.css         # Tailwind v4 entry + CSS-variable theme
components/
  providers/          # query-provider, i18n-provider
  ui/                 # shadcn/ui primitives (10 of them)
  *.tsx               # Feature components (player-card, game-card, navigation, …)
lib/
  api.ts              # URL registry — the only place endpoint paths are written
  types.ts            # Shared domain types
  data.ts             # Hardcoded mock data, still rendered by several routes
  utils.ts            # cn() helper
  i18n/config.ts      # i18next init
locales/{en,uk,pl,be}/common.json
```

### Data fetching

`lib/api.ts` exports a single `API` object of URLs built from `process.env.NEXT_PUBLIC_HOST_URL` —
constants for static paths, functions for parameterised ones. **Add new endpoints there**, never
inline a URL in a component.

Queries are plain TanStack Query with a flat string key and an inline fetch:

```ts
const { data: players = [] } = useQuery<Player[]>({
  queryKey: ["players"],
  queryFn: () => fetch(API.GET_ALL_PLAYERS).then((res) => res.json()),
});
```

`QueryProvider` sets `staleTime: 60_000`, `refetchOnWindowFocus: false`, `retry: 1`.

**There is no shared fetch wrapper, and no response is status-checked.** Every `queryFn` is a raw
`fetch(...).then((res) => res.json())`, so a 404 or 500 resolves as a _successful_ query whose data
is the error body — `isError` stays false and the UI renders garbage rather than an error state. If
you touch a data path, prefer checking `res.ok` and throwing; if you introduce a shared helper, route
new call sites through it rather than leaving two conventions.

Mutations use `useMutation` plus `queryClient.invalidateQueries` (see `app/add-results/page.tsx`).

### Real data vs mock data — check before you trust a page

`lib/data.ts` is 564 lines of hardcoded fixtures left from the scaffold, and **several routes still
render it instead of the API**:

| Route                                                               | Source                                                 |
| ------------------------------------------------------------------- | ------------------------------------------------------ |
| `/`                                                                 | API (8 queries) + one mock helper (`getPlayerWinRate`) |
| `/players`, `/events`, `/events/[id]`, `/rating`, `/add-results`    | API                                                    |
| `/games`, `/games/[id]`, `/rankings`, `/analytics`, `/players/[id]` | **mock only — no queries at all**                      |

So a change that looks broken on `/games` may simply be rendering fixtures. When wiring one of those
routes to the API, add the endpoint to `lib/api.ts` and drop the `@/lib/data` import rather than
leaving both.

### Styling

**Tailwind CSS v4, CSS-first — there is no `tailwind.config.js`.** Theme tokens are CSS variables in
`app/globals.css`; PostCSS runs `@tailwindcss/postcss`. Add or change design tokens in `globals.css`,
not in a JS config.

shadcn/ui is configured in `components.json` (`new-york`, `baseColor: neutral`, `cssVariables: true`,
lucide icons). Primitives live in `components/ui/`; only ten are vendored, so a new one must be added
deliberately. Compose with `cn()` from `lib/utils.ts` and prefer semantic token classes
(`bg-secondary`, `text-foreground`) over raw hex — some existing code hardcodes values like
`bg-[#363636]`, which is debt, not the pattern.

Note `components.json` aliases `@/hooks`, but **no `hooks/` directory exists**. Create it if you need
shared hooks.

### Path alias

`@/*` maps to the repository root, so imports are `@/components/...`, `@/lib/...`, `@/locales/...`.

### i18n

i18next + react-i18next with four locales: **en, uk, pl, be**. All strings live in
`locales/<lng>/common.json` under a single `translation` namespace; read them with `useTranslation()`
and `t('key')`. Language is detected from cookie → localStorage → navigator, cached to cookie and
localStorage, and forced to `en` during SSR to keep hydration stable. `useSuspense: false` is set.

**Adding UI text means adding the key to all four locale files.** A missing key silently falls back
to English.

### Auth is cosmetic

`components/navigation.tsx` decides admin visibility by comparing `localStorage.ADMIN_PASSWORD`
against `NEXT_PUBLIC_ADMIN_PASSWORD` / `NEXT_PUBLIC_MODERATOR_PASSWORD`. Anything prefixed
`NEXT_PUBLIC_` is inlined into the client bundle, so those passwords ship to every visitor and this
gate only hides nav links — it does not protect anything. The API behind it has no authentication
either. Do not build on this as if it were access control, and do not put a real secret in a
`NEXT_PUBLIC_` variable.

### Environment

| Variable                         | Purpose                                  |
| -------------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_HOST_URL`           | Backend API base URL                     |
| `NEXT_PUBLIC_ADMIN_PASSWORD`     | Nav-visibility gate (public — see above) |
| `NEXT_PUBLIC_MODERATOR_PASSWORD` | Nav-visibility gate (public — see above) |

`.env` ships with a remote backend URL active and a commented-out localhost alternative. Check which
is live before assuming you are hitting a local API.

## Code Conventions

Match the file you are editing; the codebase is not uniform. Where it is consistent:

- **Components are named function declarations with destructured props** (`export function
PlayerCard({ player, rank }: PlayerCardProps)`). Props interfaces are declared above the component.
- **Booleans read as predicates** — `isLoading`, `hasBorder`, `showStats`.
- **Early returns** for empty and loading states; keep the happy path unnested.
- **Hooks at the top level of the component, unconditionally.** `player-card.tsx` had a
  `useTranslation()` inside an `if` — a real render-order bug, now fixed. Never call a hook inside a
  branch, loop, or nested function.
- **Derive during render instead of syncing with an effect.** `set-state-in-effect` already fires
  three times in this repo; do not add a fourth. Reach for `useEffect` only for genuine external
  synchronisation.

### Comments

Short and essential only. Explain the _why_ the code cannot state — a constraint, a non-obvious
invariant, a deliberate deviation. One or two lines. Never restate the next line.

### Large files

`app/events/page.tsx` (1176 lines), `app/add-results/page.tsx` (893) and `app/analytics/page.tsx`
(656) hold page logic, layout and helpers in one file. When working in them, extract the piece you
touch into `components/` rather than growing the file further.

## Testing

**There is no test framework installed** — no Jest, no Vitest, no test script, no test files. Do not
claim a change is "tested" here. Verify with `npx tsc --noEmit`, `npm run lint`, `npm run build`, and
by exercising the affected route in the browser. If a change genuinely needs automated tests,
introducing a runner is a decision to raise first, not to make silently.

## Unfinished scaffold

Confirmed dead or unwired — do not treat any of it as the pattern to follow:

- `components/theme-provider.tsx` wraps `next-themes` but **is never mounted**; there is no dark-mode
  toggle despite the light/dark favicons in `layout.tsx`.
- The `Geist` / `Geist_Mono` fonts in `layout.tsx` are assigned to `_geist` / `_geistMono` and never
  applied; `body` just uses `font-sans`.
- `zod`, `sonner`, `date-fns` and `js-cookie` are dependencies with **no imports anywhere**
  (`lib/i18n/config.ts` hand-rolls its own cookie read/write instead of using `js-cookie`).
- `lib/api.ts` declares `GET_ALL_TEAMS` / `GET_TEAM_BY_ID`, but the backend has no `/teams` routes.

DO NOT WRITE USELESS COMMENTS
