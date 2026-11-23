# Shutterfly Photo Book Tracker

Real local JSON analysis of shutterfly photo book in the Shutterfly Photo lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/shutterfly-photo-book-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "shutterfly-photo-book-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/shutterfly-photo-book-mcp"]
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
      "id": "shutterfly_photo_shutterfly_photo_book-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "shutterfly-photo",
        "shutterfly",
        "photo"
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
      "id": "shutterfly_photo_shutterfly_photo_book-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "shutterfly-photo",
        "shutterfly",
        "photo"
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
| `inventory_shutterfly_photo_shutterfly_photo_book` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_shutterfly_photo_shutterfly_photo_book_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_shutterfly_photo_shutterfly_photo_book_coverage` | Show category coverage ratios and unknown categories. |
| `flag_shutterfly_photo_shutterfly_photo_book_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_shutterfly_photo_shutterfly_photo_book_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_shutterfly_photo_shutterfly_photo_book_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_shutterfly_photo_shutterfly_photo_book_baseline` | Compare category counts with the configured baseline. |
| `estimate_shutterfly_photo_shutterfly_photo_book_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_shutterfly_photo_shutterfly_photo_book_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_shutterfly_photo_shutterfly_photo_book_dependencies` | Map dependency groups and show which ones are missing. |
| `test_shutterfly_photo_shutterfly_photo_book_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_shutterfly_photo_shutterfly_photo_book_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_shutterfly_photo_shutterfly_photo_book_fixes` | Rank fixes by impact divided by effort. |
| `validate_shutterfly_photo_shutterfly_photo_book_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_shutterfly_photo_shutterfly_photo_book_duplicates` | Group items with the same category and normalized name. |
| `measure_shutterfly_photo_shutterfly_photo_book_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_shutterfly_photo_shutterfly_photo_book_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_shutterfly_photo_shutterfly_photo_book_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_shutterfly_photo_shutterfly_photo_book_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_shutterfly_photo_shutterfly_photo_book_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_shutterfly_photo_shutterfly_photo_book_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_shutterfly_photo_shutterfly_photo_book_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_shutterfly_photo_shutterfly_photo_book_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_shutterfly_photo_shutterfly_photo_book_next_steps` | Recommend the next five actions with quick wins. |
| `open_shutterfly_photo_shutterfly_photo_book_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
