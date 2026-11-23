# Oil Change Interval Tracker

Real local JSON analysis of oil change interval in the Oil Change lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/oil-change-interval-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "oil-change-interval-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/oil-change-interval-mcp"]
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
      "id": "oil_change_oil_change_interval-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "oil-change",
        "oil",
        "change"
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
      "id": "oil_change_oil_change_interval-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "oil-change",
        "oil",
        "change"
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
| `inventory_oil_change_oil_change_interval` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_oil_change_oil_change_interval_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_oil_change_oil_change_interval_coverage` | Show category coverage ratios and unknown categories. |
| `flag_oil_change_oil_change_interval_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_oil_change_oil_change_interval_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_oil_change_oil_change_interval_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_oil_change_oil_change_interval_baseline` | Compare category counts with the configured baseline. |
| `estimate_oil_change_oil_change_interval_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_oil_change_oil_change_interval_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_oil_change_oil_change_interval_dependencies` | Map dependency groups and show which ones are missing. |
| `test_oil_change_oil_change_interval_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_oil_change_oil_change_interval_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_oil_change_oil_change_interval_fixes` | Rank fixes by impact divided by effort. |
| `validate_oil_change_oil_change_interval_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_oil_change_oil_change_interval_duplicates` | Group items with the same category and normalized name. |
| `measure_oil_change_oil_change_interval_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_oil_change_oil_change_interval_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_oil_change_oil_change_interval_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_oil_change_oil_change_interval_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_oil_change_oil_change_interval_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_oil_change_oil_change_interval_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_oil_change_oil_change_interval_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_oil_change_oil_change_interval_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_oil_change_oil_change_interval_next_steps` | Recommend the next five actions with quick wins. |
| `open_oil_change_oil_change_interval_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
