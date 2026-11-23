# Hbo Max Watchlist Tracker

Real local JSON analysis of hbo max watchlist in the Hbo Max lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/hbo-max-watchlist-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "hbo-max-watchlist-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/hbo-max-watchlist-mcp"]
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
      "id": "hbo_max_hbo_max_watchlist-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "hbo-max",
        "hbo",
        "max"
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
      "id": "hbo_max_hbo_max_watchlist-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "hbo-max",
        "hbo",
        "max"
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
| `inventory_hbo_max_hbo_max_watchlist` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_hbo_max_hbo_max_watchlist_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_hbo_max_hbo_max_watchlist_coverage` | Show category coverage ratios and unknown categories. |
| `flag_hbo_max_hbo_max_watchlist_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_hbo_max_hbo_max_watchlist_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_hbo_max_hbo_max_watchlist_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_hbo_max_hbo_max_watchlist_baseline` | Compare category counts with the configured baseline. |
| `estimate_hbo_max_hbo_max_watchlist_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_hbo_max_hbo_max_watchlist_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_hbo_max_hbo_max_watchlist_dependencies` | Map dependency groups and show which ones are missing. |
| `test_hbo_max_hbo_max_watchlist_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_hbo_max_hbo_max_watchlist_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_hbo_max_hbo_max_watchlist_fixes` | Rank fixes by impact divided by effort. |
| `validate_hbo_max_hbo_max_watchlist_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_hbo_max_hbo_max_watchlist_duplicates` | Group items with the same category and normalized name. |
| `measure_hbo_max_hbo_max_watchlist_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_hbo_max_hbo_max_watchlist_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_hbo_max_hbo_max_watchlist_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_hbo_max_hbo_max_watchlist_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_hbo_max_hbo_max_watchlist_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_hbo_max_hbo_max_watchlist_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_hbo_max_hbo_max_watchlist_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_hbo_max_hbo_max_watchlist_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_hbo_max_hbo_max_watchlist_next_steps` | Recommend the next five actions with quick wins. |
| `open_hbo_max_hbo_max_watchlist_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
