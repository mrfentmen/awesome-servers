# Kindle Reading List Tracker

Real local JSON analysis of kindle reading list in the Kindle Reading lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/kindle-reading-list-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "kindle-reading-list-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/kindle-reading-list-mcp"]
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
      "id": "kindle_reading_kindle_reading_list-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "kindle-reading",
        "kindle",
        "reading"
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
      "id": "kindle_reading_kindle_reading_list-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "kindle-reading",
        "kindle",
        "reading"
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
| `inventory_kindle_reading_kindle_reading_list` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_kindle_reading_kindle_reading_list_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_kindle_reading_kindle_reading_list_coverage` | Show category coverage ratios and unknown categories. |
| `flag_kindle_reading_kindle_reading_list_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_kindle_reading_kindle_reading_list_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_kindle_reading_kindle_reading_list_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_kindle_reading_kindle_reading_list_baseline` | Compare category counts with the configured baseline. |
| `estimate_kindle_reading_kindle_reading_list_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_kindle_reading_kindle_reading_list_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_kindle_reading_kindle_reading_list_dependencies` | Map dependency groups and show which ones are missing. |
| `test_kindle_reading_kindle_reading_list_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_kindle_reading_kindle_reading_list_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_kindle_reading_kindle_reading_list_fixes` | Rank fixes by impact divided by effort. |
| `validate_kindle_reading_kindle_reading_list_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_kindle_reading_kindle_reading_list_duplicates` | Group items with the same category and normalized name. |
| `measure_kindle_reading_kindle_reading_list_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_kindle_reading_kindle_reading_list_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_kindle_reading_kindle_reading_list_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_kindle_reading_kindle_reading_list_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_kindle_reading_kindle_reading_list_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_kindle_reading_kindle_reading_list_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_kindle_reading_kindle_reading_list_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_kindle_reading_kindle_reading_list_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_kindle_reading_kindle_reading_list_next_steps` | Recommend the next five actions with quick wins. |
| `open_kindle_reading_kindle_reading_list_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
