# Spotify Playlist Builder Tracker

Real local JSON analysis of spotify playlist builder in the Spotify Playlist lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/spotify-playlist-builder-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "spotify-playlist-builder-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/spotify-playlist-builder-mcp"]
    }
  }
}
```

## Input

Pass an array, an object with an `items` array, or a JSON file path. Every item needs a name and category. Cost, quantity, dates, condition, tags and notes are optional.

```json
{
  "items": [
    {
      "id": "spotify_playlist_spotify_playlist_builder-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "spotify-playlist",
        "spotify",
        "playlist"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "spotify_playlist_spotify_playlist_builder-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "spotify-playlist",
        "spotify",
        "playlist"
      ],
      "cost": 35,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_spotify_playlist_spotify_playlist_builder` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_spotify_playlist_spotify_playlist_builder_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_spotify_playlist_spotify_playlist_builder_coverage` | Show category coverage ratios and unknown categories. |
| `flag_spotify_playlist_spotify_playlist_builder_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_spotify_playlist_spotify_playlist_builder_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_spotify_playlist_spotify_playlist_builder_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_spotify_playlist_spotify_playlist_builder_baseline` | Compare category counts with the configured baseline. |
| `estimate_spotify_playlist_spotify_playlist_builder_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_spotify_playlist_spotify_playlist_builder_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_spotify_playlist_spotify_playlist_builder_dependencies` | Map dependency groups and show which ones are missing. |
| `test_spotify_playlist_spotify_playlist_builder_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_spotify_playlist_spotify_playlist_builder_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_spotify_playlist_spotify_playlist_builder_fixes` | Rank fixes by impact divided by effort. |
| `validate_spotify_playlist_spotify_playlist_builder_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_spotify_playlist_spotify_playlist_builder_duplicates` | Group items with the same category and normalized name. |
| `measure_spotify_playlist_spotify_playlist_builder_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_spotify_playlist_spotify_playlist_builder_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_spotify_playlist_spotify_playlist_builder_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_spotify_playlist_spotify_playlist_builder_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_spotify_playlist_spotify_playlist_builder_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_spotify_playlist_spotify_playlist_builder_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_spotify_playlist_spotify_playlist_builder_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_spotify_playlist_spotify_playlist_builder_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_spotify_playlist_spotify_playlist_builder_next_steps` | Recommend the next five actions with quick wins. |
| `open_spotify_playlist_spotify_playlist_builder_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
