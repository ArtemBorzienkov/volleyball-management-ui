# SandStats — Beach Volleyball Analytics

SandStats is the web front-end for a beach‑volleyball tournament‑management and
player‑statistics platform. It lets a community (the deployed instance serves the
Warsaw beach‑volley scene at **waw-beach-volley.site**) record 2‑v‑2 tournament
results and browse rich analytics about players, events and an ELO‑style rating
system.

The app is a **Next.js (App Router) client** that talks to a separate backend API
(`volley-app-service`, NestJS + Prisma + Postgres). All persistent data —
players, events, games, ratings and rankings — lives in that backend; this
repository is purely the UI.

> The project was originally scaffolded with [v0.app](https://v0.app) and later
> extended by hand.

---

## Table of contents

- [What the app does](#what-the-app-does)
- [Tech stack](#tech-stack)
- [Pages & features](#pages--features)
- [Domain model](#domain-model)
- [Rating system](#rating-system)
- [Access control](#access-control)
- [Player anonymity & privacy](#player-anonymity--privacy)
- [Internationalization](#internationalization)
- [Project structure](#project-structure)
- [Backend API](#backend-api)
- [Getting started (development)](#getting-started-development)
- [Testing](#testing)
- [Environment variables](#environment-variables)
- [Build & deployment](#build--deployment)
- [Notes & known quirks](#notes--known-quirks)

---

## What the app does

- **Track tournaments (events)** — each event holds a set of 2‑v‑2 games plus final
  standings (tournament places).
- **Record results** — moderators/admins enter events and game scores through a
  guided form, or bulk‑import them from an Excel (`.xlsx`) file.
- **Analyze players** — per‑player win rate, medals, recent form, head‑to‑head,
  and a rating‑over‑time chart.
- **Rank players** — leaderboards by rating, win rate, won events and games
  played, split by gender (All / Women / Men).
- **Discover winning combinations** — best 2‑player team pairings.

---

## Tech stack

| Area | Choice |
|------|--------|
| Framework | **Next.js 16** (App Router, React Server/Client components) |
| UI runtime | **React 19** + TypeScript |
| Styling | **Tailwind CSS v4** + `tailwindcss-animate` / `tw-animate-css` |
| Components | **shadcn/ui** primitives built on **Radix UI** (`components/ui`) |
| Icons | `lucide-react` |
| Data fetching | **TanStack Query v5** (`@tanstack/react-query`) |
| Forms | `react-hook-form` + `@hookform/resolvers` + `zod` |
| Charts | `recharts` (wrapped by the shadcn `ChartContainer`) |
| i18n | `i18next` + `react-i18next` + browser language detector |
| Spreadsheet import | `xlsx` (SheetJS) |
| Theming | `next-themes` |
| Toasts | `sonner` |
| Analytics | `@vercel/analytics` |
| Runtime | Node 20 |

The design system, fonts (Geist / Geist Mono) and global tokens live in
`app/globals.css` / `styles/globals.css` and `components.json`.

---

## Pages & features

### Live pages (in the primary navigation)

| Route | Purpose |
|-------|---------|
| `/` | **Overview / dashboard** |
| `/players` | **Players leaderboard** |
| `/events` | **Events list** |
| `/calendar` | **Tournaments open for registration** — enter, cancel, create |
| `/ongoing/[id]` | **Run a live tournament** — fixtures, standings, bracket or rotation |
| `/add-results` | **Record results** (admin/moderator only) |

#### `/` — Overview
The landing dashboard. Shows four KPI stat cards (Active Players, Total Games,
Tournaments with upcoming count, Avg Win Rate of the top‑10) and three
side‑by‑side **Top Players** columns: **By Rank**, **By Won Events** (with
gold/silver/bronze medal counts), and **By Games Win Rate**. A gender filter
(ALL / W / M) re‑slices all three columns from grouped API responses. An
info popover explains how the rating works.

#### `/players` — Players leaderboard
A single sortable, searchable table of all players (`GET /players/full`). Columns:
avatar, name, rating (rank), total events, tournament medals, total games, win
rate, and a "last games" win/loss strip. Supports client‑side name search,
gender filtering, and column‑header sorting. Clicking a row opens that player's
**rating history** at `/rating?id=…`.

#### `/events` — Events list
A paginated list of events, filterable by type (**All / Tournament / Training**).
Each event card renders a per‑player standings table (place with medal icons,
games W‑L, points W‑L) plus computed **highlights** (perfect record, win streak,
or winless). Data is assembled client‑side by combining `/events`, `/games` and
`/players`. Clicking a card opens `/events/[id]`.

#### `/events/[id]` — Event detail
Aggregate standings for one event: a per‑player table (games W‑L, cumulative rank
change, points W‑L) followed by every individual game, each rendered as
`Team 1 | score | Team 2` with per‑player rating and rank‑change badges.

#### `/calendar` — Open tournaments
Every tournament still accepting entrants (`GET /ongoing/open`). Each card names
the organiser, whether it is **public** or **private**, the entrants so far, and
the players waiting without a partner. Registering opens a dialog; a logged-out
visitor gets a login prompt first and is returned to the dialog afterwards. A full
tournament stays listed with its control disabled and a "no spots left" note, and
an entrant can cancel their own registration up to the day before.

"New tournament" creates one: name, capacity, place, time, date, who may register,
and the **tournament type** — which is where a full-rotation event is set up.

#### `/ongoing/[id]` — Live tournament
Tabs over one event. Which tabs appear depends on the scheme, so a tab never shows
the same games twice under a different model:

| Tab | Shown for | Contents |
|-----|-----------|----------|
| **Rotation** | `fullRotation` | Every round's groups, their three fixtures with score entry, the per-player table, and "generate next round". |
| **Matches** | the other schemes | The flat fixture list, grouped by round, with score entry. |
| **Standings** | the other schemes | The team table. |
| **Bracket** | `groupsPlayoff` | The knockout tree. |
| **Results** | all | Final places, and the hand-off into `/add-results`. |
| **Config** | organiser/admin | Courts, caps, visibility, scheme and its fields. |

**Full rotation** is the individual format: players register alone, are seeded by
rating into groups of four, and every player partners every other player in their
group once — three games, from which each player takes a place in the group table.
When every result of a round is in, the organiser generates the next one: the top
two of each group go up, the bottom two go down, and the ends of the ladder stay
put. After the configured last round the strongest group's table is the result. The
promote/relegate arrows next to each place come from
[`lib/ongoing-rotation.ts`](lib/ongoing-rotation.ts); the tables themselves are
computed by the API, so a corrected score reshuffles them on the next refetch.

#### `/add-results` — Record results *(admin/moderator)*
The write path of the app. A `react-hook-form` workflow to create an event with
its games and final places in one submission (`POST /events/with-games`):

- **Event information** — name, date, location.
- **Tournament places** — dynamic rows mapping a place (1–12) to a player.
- **Game results** — dynamic rows; each game has Team 1 / Team 2 with two player
  selectors and a points input. (Winners/ties are derived by the backend from
  the point totals.)
- **Inline player creation** — a "＋ Add new player" option in any player select
  opens a modal that creates the player (`POST /players`) and selects them.
- **Excel import** — upload an `.xlsx` whose rows are marked with `places` /
  `games` section headers; SheetJS parses it and pre‑fills the form, resolving
  player names to IDs.

#### `/rating?id=<playerId>` — Rating history
Reached by clicking a player (from Overview or Players). Shows a collapsible
Recharts line chart of the player's rating over time (`/rankings/player-rank-history`,
collapsed to one point per tournament date) and, below it, an **infinite‑scrolling**
table of every game the player played (`/games/player/:id`), oriented so the page
player is always Team 1 / Player 1, with per‑game rating change and new rating.

### Legacy / hidden pages

These routes still exist but their nav links are commented out in
`components/navigation.tsx`, and they read from the **static mock data** in
`lib/data.ts` (no live API, no i18n). They predate the live API integration and
are kept for reference:

| Route | What it was |
|-------|-------------|
| `/games`, `/games/[id]` | Match browser + single‑game breakdown |
| `/rankings` | Multi‑category leaderboard with a top‑3 podium |
| `/analytics` | Advanced dashboard (head‑to‑head, radar, distribution & location charts) |
| `/players/[id]` | Old player profile (still reachable via head‑to‑head links) |

> ⚠️ If you revive these pages, migrate them off `lib/data.ts` to the live API
> first — otherwise they will display seed/demo players and games.

---

## Domain model

Types live in [`lib/types.ts`](lib/types.ts). The core entities:

- **Player** — identity, gender, active flag, and aggregate stats (games, wins,
  losses, sets, points, tournaments won). `FullPlayer` adds `rank`, `medals`,
  `winRate`, `totalEvents` and a `recentGames` form array.
- **Team** — a pair of players.
- **Game** — two teams, a set‑by‑set score, date, location, `eventId`, winner.
- **Event** — name, date range, location, its games, winners and status
  (`upcoming` / `ongoing` / `completed`).
- **PlayerRanking** — a ranked entry for a metric; `value` is a number for most
  metrics or a `MedalCounts` object for the won‑events metric.
- **PlayerRankHistory** / **PlayerGameRow** — the per‑game rating chain used by
  the `/rating` page.

---

## Rating system

Every player starts at **rank 1000**. Winning teams gain rating and losing teams
lose it; the size of the change scales with the rating gap between the teams, so
**underdog wins earn more**. The rating is stored per game as a chain
(`game_player_rank`: `rank` = rating after the game, `rankChange` = the delta),
computed by the backend. The `/rating` page and the event/player views visualize
this chain. See
[`docs/superpowers/specs/2026-07-19-player-rating-history-design.md`](docs/superpowers/specs/2026-07-19-player-rating-history-design.md)
for the design of the rating‑history feature.

---

## Access control

Access control is **client‑side only** and lightweight:

- `components/navigation.tsx` reads `localStorage.ADMIN_PASSWORD` and compares it
  against `NEXT_PUBLIC_ADMIN_PASSWORD` / `NEXT_PUBLIC_MODERATOR_PASSWORD`.
- A match reveals the **Add Results** nav link (`isAdmin`).

This only hides the link in the UI — the `/add-results` route itself is not
guarded, and the real authority is the backend. Treat this as a convenience gate,
not a security boundary.

---

## Player anonymity & privacy

### Masking

A player whose account has `isAnonymous` set is rendered with their name masked —
`Artem Borzienkov` becomes `Ar*** Bo***`. The API still returns the real name; the
masking happens **here**, in [`lib/player-name.ts`](lib/player-name.ts):

- `playerDisplayName(player)` — the name a viewer should see. A payload without the
  flag renders as before, so an older backend degrades gracefully.
- `playerInitials(player)` — the avatar initial, `*` for a masked player, because a
  single real letter is still identifying.
- `maskPlayerName(name)` — the masking itself: first two characters of each word,
  counted as characters (so an accented or Cyrillic name is not cut mid-glyph).

**Where it is applied:** everywhere a name is *content* — the players leaderboard,
rankings, rating history, event standings and highlights, game cards, the calendar's
solo pool, tournament rosters and the rotation tables. `teamName()` in
`lib/ongoing-standings.ts` masks both halves of a pair, which covers every team
label at once.

**Where it is deliberately not applied:** the controls that pick a specific person —
`/add-results`, the sign-up player select, the roster editors and the partner
picker. An organiser has to be able to tell two players apart to record a result,
and `/add-results` keys a lookup on the player name. The viewer's own name in the
registration dialog is also left in full.

That means masking is a display reduction, not anonymisation — the real name is
still in the public API response. `/privacy` states this plainly rather than
implying more protection than exists.

### The two notices

| Route | Covers |
|-------|--------|
| `/privacy` | What player data is collected, what is published, the anonymity option and its limits, legal bases, retention, rights. Linked from the required sign-up checkbox and the footer. |
| `/cookies` | Cookies and browser storage, the consent categories, and the current stored choice. |

Sign-up requires ticking consent to the processing (never pre-ticked); the API
refuses `POST /user` without `acceptDataProcessing: true` and records the instant it
was given.

**There is no UI for the anonymity flag.** Sign-up does not offer it, so it is set
out of band; `/privacy` tells players to ask the controller instead of implying a
toggle they cannot reach. Add the control and that wording changes with it.

---

## Internationalization

Configured in [`lib/i18n/config.ts`](lib/i18n/config.ts). Four locales ship with
the app:

- 🇬🇧 English (`en`) · 🇺🇦 Ukrainian (`uk`) · 🇵🇱 Polish (`pl`) · Belarusian (`be`)

Translation files live in `locales/<lng>/common.json`. Language is detected from
cookie → localStorage → browser, cached for a year, and switchable in the header
via `LanguageSwitcher`. The server always renders `en` for SSR safety, then the
client hydrates to the detected language (`LayoutWrapper` syncs `<html lang>`).

---

## Project structure

```
app/                    # Next.js App Router
  layout.tsx            # Root layout: metadata, providers, fonts, analytics
  page.tsx              # / — Overview dashboard
  players/page.tsx      # /players — leaderboard
  players/[id]/page.tsx # legacy player profile (mock data)
  events/page.tsx       # /events — list
  events/[id]/page.tsx  # /events/:id — detail
  add-results/page.tsx  # /add-results — record results (admin)
  rating/page.tsx       # /rating?id= — rating history + games
  games/, rankings/, analytics/   # legacy/hidden (mock data)
  globals.css
components/
  navigation.tsx        # header + admin-gated nav
  layout-wrapper.tsx    # <html lang> sync
  stat-card.tsx, player-card.tsx, game-card.tsx
  gender-filter.tsx, medal-icons.tsx, language-switcher.tsx
  providers/            # QueryProvider (React Query) + I18nProvider
  ui/                   # shadcn/ui primitives
lib/
  api.ts                # all backend endpoint builders
  types.ts              # domain types
  data.ts               # static mock data + helpers (legacy pages)
  utils.ts              # cn() etc.
  i18n/config.ts        # i18next setup
locales/                # en / uk / pl / be translations
docs/                   # design specs
public/                 # icons, placeholders
```

---

## Backend API

All endpoints are built in [`lib/api.ts`](lib/api.ts) from
`NEXT_PUBLIC_HOST_URL`. The backend is the separate **`volley-app-service`**
(NestJS + Prisma). Key endpoints the UI consumes:

| Endpoint | Used by |
|----------|---------|
| `GET /players` / `GET /players/full` / `GET /players/:id` | Overview, Players, Rating |
| `POST /players` | Add Results (inline create) |
| `GET /events` / `GET /events/:id` | Events list & detail |
| `POST /events/with-games` | Add Results (create event + games) |
| `GET /games` / `GET /games/:id` | Overview, legacy games |
| `GET /games/player/:id?skip&take` | Rating page (paginated games) |
| `GET /rankings/{wins,win-rate,won-events,games-played,top-rank}` | Overview / leaderboards |
| `GET /rankings/best-team-combinations` | Overview (best teams) |
| `GET /rankings/player-rank-history?playerId=` | Rating chart |

React Query defaults (`components/providers/query-provider.tsx`): `staleTime` 1
minute, `retry` 1, no refetch on window focus.

---

## Getting started (development)

**Prerequisites:** Node 20, and a running `volley-app-service` backend (or point
at the deployed one).

```bash
# install (package-lock.json is committed; pnpm-lock.yaml also present)
npm install

# configure the backend URL and passwords
cp .env .env.local   # then edit values (see below)

# run the dev server
npm run dev
```

Then open the app in the browser. Other scripts:

```bash
npm run build   # production build (next build)
npm run start   # serve the production build (next start)
npm run lint    # eslint
npm test        # vitest, once
npm run test:watch
```

> **Local vs remote backend:** `.env` ships pointing `NEXT_PUBLIC_HOST_URL` at a
> backend host. If you run `volley-app-service` locally it typically listens on
> `:3000`, so run the UI on a different port (e.g. `next dev -p 3001`) to avoid a
> clash, and set `NEXT_PUBLIC_HOST_URL=http://localhost:3000`. A locally‑changed
> backend endpoint won't be reflected until the UI's `NEXT_PUBLIC_HOST_URL`
> points at that local instance.

---

## Testing

```bash
npm test            # vitest run
npm run test:watch  # vitest
```

**Vitest + Testing Library**, configured in
[`vitest.config.mts`](vitest.config.mts) with `jsdom` and the same `@/*` alias
`tsconfig.json` defines. Tests sit next to what they cover as `*.test.ts(x)`.

What is covered:

- **Pure modules under `lib/`** — the promote/relegate direction and group naming
  in `ongoing-rotation.ts`, the capacity rules in `ongoing-permissions.ts`
  (including the fullRotation seat count, which ignores `maxTeams`), and the
  fetch-boundary defaults in `ongoing-normalize.ts`.
- **Components through jsdom** — `ongoing-rotation-tab.test.tsx` renders the tab
  against a fixture and asserts which rounds and groups appear, that each fixture
  lands in its own group card, and when "generate next round" is offered. The
  providers it sits inside (i18n, React Query, toast, auth) are stubbed with
  `vi.mock`, so a test needs no query client or live locale bundle.

Not covered by tests: the routes under `app/` and anything that depends on a real
API response. Verify those against a running backend in the browser — `tsc
--noEmit` and `npm run lint` are still part of checking any change, since
`next build` does not typecheck.

---

## Environment variables

All are **`NEXT_PUBLIC_*`**, so they are embedded into the client bundle at
**build time** (both by `next dev`/`next build` and via Docker build args).

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_HOST_URL` | Base URL of the `volley-app-service` backend |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Password that unlocks admin nav (matched client‑side) |
| `NEXT_PUBLIC_MODERATOR_PASSWORD` | Password that unlocks moderator nav |

Because these ship to the browser, they are **not secrets** in the strong sense —
the real enforcement must live in the backend.

---

## Build & deployment

Deployment is automated by GitHub Actions
([`.github/workflows/production-deployment.yml`](.github/workflows/production-deployment.yml)):

1. On push to `main`, a Docker image is built (`Dockerfile`, Node 20) with the
   production `NEXT_PUBLIC_*` build args (host `https://api.waw-beach-volley.site`,
   passwords from repo secrets).
2. The image is pushed to Docker Hub
   (`artemborzienkov/volleyball-management-ui:<run_id>`).
3. Over SSH, the target DigitalOcean host stops/removes the old container, pulls
   the new image, and runs it mapped as `-p 8080:3000`.

Because `NEXT_PUBLIC_*` values are baked in at build time, changing them requires
a rebuild, not just a container restart.

---

## Notes & known quirks

- **`next.config.mjs`** sets `typescript.ignoreBuildErrors: true` and
  `images.unoptimized: true` — TypeScript errors will not fail the production
  build, so run `npm run lint` / `tsc` locally to catch them.
- **Legacy pages** (`/games`, `/rankings`, `/analytics`, `/players/[id]`) render
  the static seed data in `lib/data.ts`, not live data. Row clicks on `/players`
  route to `/rating`, not the old `/players/[id]` profile.
- **Two lockfiles** exist (`package-lock.json` and `pnpm-lock.yaml`); the Docker
  build uses `npm install`. Pick one package manager for consistency.
- The Vercel‑style v0 sync badges from the original scaffold have been replaced
  by this documentation; the app is deployed via the Docker + DigitalOcean
  pipeline above, not Vercel.
</content>
</invoke>
