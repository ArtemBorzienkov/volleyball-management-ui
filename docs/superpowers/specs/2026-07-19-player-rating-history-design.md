# Player Rating History page — Design

**Date:** 2026-07-19
**Repos:** `volley-app-service` (backend, NestJS + Prisma), `volleyball-management-ui` (frontend, Next.js 16 app-router)

## Goal

Add a new page at `/rating?id={playerId}` that shows a line graph of a player's rating
changes over time. The page is opened by clicking a player in the Overview page or the
Players page. A new backend endpoint returns every `game_player_rank` record for the
player so the UI can plot rating (Y) against game date (X).

## Context / constraints

- `game_player_rank` columns: `id, gameId, playerId, rank, rankChange`. It has **no date
  column** — the date lives on the related `Game.date`. The endpoint must join the game
  and order chronologically.
- `rank` = the player's absolute rating recorded after that game. `rankChange` = the delta
  for that game.
- The UI already has `recharts` installed and `@tanstack/react-query` + `lib/api.ts` for
  data fetching. `useSearchParams` requires a `<Suspense>` boundary in Next 16 (see
  `app/games/page.tsx`).
- Overview player clicks currently go to the existing detail page `/players/[id]` via
  `PlayerCard`. Players-page table rows are styled `cursor-pointer` but have **no
  navigation wired up** today.

## Decisions

- Route format: `/rating?id={playerId}` (query param).
- Click behavior: **replace** the click target in Overview and Players with the rating page.
  The existing `/players/[id]` page stays in place, just no longer linked from these spots.
- Graph: plot absolute `rank` over the full history. No date-range filter.

## Backend — `volley-app-service`

New read-only endpoint in the **rankings** module (it already owns `game_player_rank` reads).

- **Route:** `GET /rankings/player-rank-history?playerId={id}`
- **DTO** `PlayerRankHistoryDto`:
  ```ts
  { gameId: string; date: Date; rank: number; rankChange: number }
  ```
- **Service** `getPlayerRankHistory(playerId: string): Promise<PlayerRankHistoryDto[]>`:
  ```ts
  const records = await this.prisma.gamePlayerRank.findMany({
    where: { playerId },
    include: { game: { select: { date: true } } },
    orderBy: { game: { date: 'asc' } },
  });
  return records.map((r) => ({
    gameId: r.gameId,
    date: r.game.date,
    rank: r.rank,
    rankChange: r.rankChange,
  }));
  ```
- **Controller** method on `RankingsController` reading `@Query('playerId')`.
- Empty result (unknown player or no games) returns `[]` — not an error. This renders as an
  empty graph on the UI.

## Frontend — `volleyball-management-ui`

### New route `app/rating/page.tsx`
- Default export renders `<Navigation />` + a `<Suspense>`-wrapped client component (Next 16
  requires Suspense around `useSearchParams`, matching `app/games/page.tsx`).
- Inner component:
  - Reads `id` via `useSearchParams().get('id')`.
  - `useQuery` for the player (existing `GET_PLAYER_BY_ID`) to show the name in the header.
  - `useQuery` for rank history (new `GET_PLAYER_RANK_HISTORY`).
  - Header: player name + "Rating history".
  - Chart: recharts `LineChart` inside `ResponsiveContainer` — **X = game date**
    (`toLocaleDateString`), **Y = `rank`**, one `Line`, with `Tooltip`, `CartesianGrid`,
    `XAxis`/`YAxis`.
  - States: loading, missing `id`, and empty-history are all handled.

### Supporting changes
- **`lib/api.ts`:** add
  `GET_PLAYER_RANK_HISTORY: (id: string) => \`${process.env.NEXT_PUBLIC_HOST_URL}/rankings/player-rank-history?playerId=${id}\``.
- **`lib/types.ts`:** add a `PlayerRankHistory` type mirroring the DTO.
- **Repoint clicks** to `/rating?id=${player.id}`:
  - `components/player-card.tsx` — the two `Link href={\`/players/${player.id}\`}` (lines ~138, ~273).
  - `app/players/page.tsx` — wire the already-`cursor-pointer` `TableRow` (line ~194) to
    navigate via `useRouter().push`.

## Out of scope (YAGNI)

- No date-range filter.
- No `rankChange` visualization (returned in the payload but only `rank` is plotted).
- The existing `/players/[id]` detail page is unchanged.

## Addendum (2026-07-19): Games list on the rating page

Extend the rating page with a collapsible graph section and, below it, a paginated
table of every game the player took part in, newest-first.

### Backend — new paginated games-for-player endpoint

- **Route:** `GET /games/player/:playerId?skip=0&take=100` (registered before `@Get(':id')`).
- **DTO** `PlayerGameRowDto` (reoriented so the page player is always Team 1 / Player 1):
  ```ts
  {
    gameId: string; date: Date;
    team1: { player1: {id,name}; player2: {id,name}; points: number };
    team2: { player1: {id,name}; player2: {id,name}; points: number };
    rankChange: number; // page player's change for this game
  }
  ```
  Response envelope: `{ games: PlayerGameRowDto[]; total: number }`.
- **Service** `getPlayerGames(playerId, skip, take)`:
  - `where`: player in any of the four `*PlayerId` slots (`OR`).
  - `include`: the four player relations (names) + `gamePlayerRanks: { where: { playerId }, select: { rankChange: true } }`.
  - `orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]` — stable tiebreak so paginated
    batches over same-day games don't duplicate/skip.
  - `skip` / `take` + a `count(where)` for `total`.
  - Map: locate the player's slot, put that team as `team1` with the player as `player1`
    and partner as `player2`; other team as `team2`; points follow; `rankChange =
    gamePlayerRanks[0]?.rankChange ?? 0`.

### Frontend

- **API:** `GET_PLAYER_GAMES: (id, skip, take) => .../games/player/${id}?skip=${skip}&take=${take}`.
- **Types:** `PlayerGameRow`, `PlayerGamesResponse`.
- **`app/rating/page.tsx`:**
  - Wrap the chart Card in a collapsible section (chevron toggle, `useState`, expanded by
    default; conditional render, no new dependency).
  - Games table (shadcn `Table`): **Date | Team 1** (player1, player2, points) **| Team 2**
    (points, player1, player2) **| Rating change**. No sort controls.
  - Highlight `team1.player1` (the page player): `font-semibold text-primary`.
  - Rating change with sign + color (green >0, red <0, muted 0).
  - Infinite scroll: `useInfiniteQuery` (batch `take=100`); `getNextPageParam` returns the
    next `skip` while loaded rows `< total`; an `IntersectionObserver` sentinel at the
    table bottom loads the next page.

### Out of scope (games list)
No column sorting, no server-side filtering beyond the player, no row virtualization.

## Testing / verification

- Backend: exercise `GET /rankings/player-rank-history?playerId=<id>` for a player with
  games (ordered, dated records) and for an unknown player (`[]`).
- Frontend: click a player from Overview and from Players → lands on `/rating?id=...`, graph
  renders with rank on Y and dates on X; verify loading and empty states. Verify via the
  running dev server + browser preview.
