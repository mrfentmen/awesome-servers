# Ups Ship Estimate Tracker

Real local JSON analysis of ups ship estimate in the Ups Ship lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/ups-ship-estimate-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "ups-ship-estimate-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/ups-ship-estimate-mcp"]
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
      "id": "ups_ship_ups_ship_estimate-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "ups-ship",
        "ups",
        "ship"
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
      "id": "ups_ship_ups_ship_estimate-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "ups-ship",
        "ups",
        "ship"
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
| `inventory_ups_ship_ups_ship_estimate` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_ups_ship_ups_ship_estimate_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_ups_ship_ups_ship_estimate_coverage` | Show category coverage ratios and unknown categories. |
| `flag_ups_ship_ups_ship_estimate_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_ups_ship_ups_ship_estimate_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_ups_ship_ups_ship_estimate_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_ups_ship_ups_ship_estimate_baseline` | Compare category counts with the configured baseline. |
| `estimate_ups_ship_ups_ship_estimate_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_ups_ship_ups_ship_estimate_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_ups_ship_ups_ship_estimate_dependencies` | Map dependency groups and show which ones are missing. |
| `test_ups_ship_ups_ship_estimate_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_ups_ship_ups_ship_estimate_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_ups_ship_ups_ship_estimate_fixes` | Rank fixes by impact divided by effort. |
| `validate_ups_ship_ups_ship_estimate_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_ups_ship_ups_ship_estimate_duplicates` | Group items with the same category and normalized name. |
| `measure_ups_ship_ups_ship_estimate_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_ups_ship_ups_ship_estimate_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_ups_ship_ups_ship_estimate_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_ups_ship_ups_ship_estimate_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_ups_ship_ups_ship_estimate_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_ups_ship_ups_ship_estimate_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_ups_ship_ups_ship_estimate_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_ups_ship_ups_ship_estimate_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_ups_ship_ups_ship_estimate_next_steps` | Recommend the next five actions with quick wins. |
| `open_ups_ship_ups_ship_estimate_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
