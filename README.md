# Leonida Legend — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/KenIDN24/gta6-trophy-guide-r4/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/KenIDN24/gta6-trophy-guide-r4/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI — the official names, descriptions and grades exactly as PlayStation publishes them, each with an original guide whose every step cites its source.

## What's inside

- **267 cited steps** across the 55 trophies, every one tagged to a named source ([S1]–[S42])
- **42 named sources** — the official PSN list first, then wikis, guides, walkthroughs and forum threads
- **32 disputes resolved** — where sources disagreed (counts, windows, triggers), the clash and the ruling are written down
- **6 missable trophies** flagged with explicit points of no return, sequenced into a **7-stage roadmap to the platinum** (≈147h route)
- A working tracker: localStorage progress, export/import, filters by kind (story / missable / collectibles / activities / partner) and grade, five sorts, search, a spoiler shield for story trophies, deep links, and a live platinum ETA

## Run it

The app is plain static files under `app/` — serve that folder with any static server and open it in a desktop browser; it works fully offline.

```sh
node serve.ts   # then open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` there with the vendored make.fun library (`vendor/makefun-frontend.ts`, unchanged from the kit).

## Layout

- `app/index.html`, `app/style.css`, `app/app.js` — the guide UI (vice-neon, no libraries, no network)
- `app/data/trophies.json` — trophies, guides, steps, sources, disputes and the roadmap
- `screenshots/` — four renders of the app itself: checklist, platinum guide, roadmap, missable filter
- `main.ts` — the hand-in program · `serve.ts` — local preview server

Unofficial fan work. Trophy names and descriptions are as PlayStation publishes them; all guide text is original to this entry. MIT licensed.
