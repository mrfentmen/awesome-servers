# Bookstore Finder Audit

Real local JSON analysis of bookstore finder in the Bookstore Finder lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/bookstore-finder-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "bookstore-finder-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/bookstore-finder-mcp"]
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
      "id": "bookstore_finder_bookstore_finder-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "bookstore-finder",
        "bookstore",
        "finder"
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
      "id": "bookstore_finder_bookstore_finder-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "bookstore-finder",
        "bookstore",
        "finder"
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
| `inventory_bookstore_finder_bookstore_finder` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_bookstore_finder_bookstore_finder_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_bookstore_finder_bookstore_finder_coverage` | Show category coverage ratios and unknown categories. |
| `flag_bookstore_finder_bookstore_finder_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_bookstore_finder_bookstore_finder_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_bookstore_finder_bookstore_finder_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_bookstore_finder_bookstore_finder_baseline` | Compare category counts with the configured baseline. |
| `estimate_bookstore_finder_bookstore_finder_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_bookstore_finder_bookstore_finder_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_bookstore_finder_bookstore_finder_dependencies` | Map dependency groups and show which ones are missing. |
| `test_bookstore_finder_bookstore_finder_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_bookstore_finder_bookstore_finder_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_bookstore_finder_bookstore_finder_fixes` | Rank fixes by impact divided by effort. |
| `validate_bookstore_finder_bookstore_finder_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_bookstore_finder_bookstore_finder_duplicates` | Group items with the same category and normalized name. |
| `measure_bookstore_finder_bookstore_finder_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_bookstore_finder_bookstore_finder_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_bookstore_finder_bookstore_finder_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_bookstore_finder_bookstore_finder_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_bookstore_finder_bookstore_finder_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_bookstore_finder_bookstore_finder_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_bookstore_finder_bookstore_finder_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_bookstore_finder_bookstore_finder_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_bookstore_finder_bookstore_finder_next_steps` | Recommend the next five actions with quick wins. |
| `open_bookstore_finder_bookstore_finder_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
