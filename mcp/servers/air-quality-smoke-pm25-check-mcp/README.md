# Wildfire Smoke PM2.5 Audit

Audit indoor and outdoor PM2.5, filter stock, sealing and clean-air coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/air-quality-smoke-pm25-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "air-quality-smoke-pm25-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/air-quality-smoke-pm25-check-mcp"]
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
      "id": "smoke_pm25-living-room-air",
      "name": "Living room air",
      "category": "indoor",
      "tags": [
        "indoor"
      ],
      "cost": 0,
      "quantity": 65,
      "condition": "fair"
    },
    {
      "id": "smoke_pm25-backyard-air",
      "name": "Backyard air",
      "category": "outdoor",
      "tags": [
        "outdoor"
      ],
      "cost": 0,
      "quantity": 120,
      "condition": "worn"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_smoke_pm25` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_smoke_pm25_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_smoke_pm25_coverage` | Show category coverage ratios and unknown categories. |
| `flag_smoke_pm25_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_smoke_pm25_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_smoke_pm25_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_smoke_pm25_baseline` | Compare category counts with the configured baseline. |
| `estimate_smoke_pm25_pm25` | Calculate the primary metric for every item with mean and pass count. |
| `find_smoke_pm25_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_smoke_pm25_dependencies` | Map dependency groups and show which ones are missing. |
| `test_smoke_pm25_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_smoke_pm25_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_smoke_pm25_fixes` | Rank fixes by impact divided by effort. |
| `validate_smoke_pm25_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_smoke_pm25_duplicates` | Group items with the same category and normalized name. |
| `measure_smoke_pm25_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_smoke_pm25_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_smoke_pm25_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_smoke_pm25_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_smoke_pm25_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_smoke_pm25_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_smoke_pm25_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_smoke_pm25_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_smoke_pm25_next_steps` | Recommend the next five actions with quick wins. |
| `open_smoke_pm25_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
