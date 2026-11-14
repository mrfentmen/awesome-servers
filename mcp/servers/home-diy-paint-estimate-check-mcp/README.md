# Paint Estimate Audit

Audit a paint stock by room surface, litres, spend, coverage and job readiness. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/home-diy-paint-estimate-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "home-diy-paint-estimate-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/home-diy-paint-estimate-check-mcp"]
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
      "id": "paint-wall",
      "name": "Living room wall paint",
      "category": "wall",
      "tags": [
        "interior",
        "eggshell"
      ],
      "cost": 55,
      "quantity": 10,
      "acquired": "2026-04-01",
      "expires": "2028-04-01",
      "condition": "new"
    },
    {
      "id": "paint-trim",
      "name": "White trim paint",
      "category": "trim",
      "tags": [
        "interior",
        "satin"
      ],
      "cost": 30,
      "quantity": 5,
      "acquired": "2026-03-01",
      "expires": "2028-03-01",
      "condition": "new"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_paint_estimate` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_paint_estimate_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_paint_estimate_coverage` | Show category coverage ratios and unknown categories. |
| `flag_paint_estimate_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_paint_estimate_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_paint_estimate_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_paint_estimate_baseline` | Compare category counts with the configured baseline. |
| `estimate_paint_estimate_paint_liters` | Calculate the primary metric for every item with mean and pass count. |
| `find_paint_estimate_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_paint_estimate_dependencies` | Map dependency groups and show which ones are missing. |
| `test_paint_estimate_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_paint_estimate_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_paint_estimate_fixes` | Rank fixes by impact divided by effort. |
| `validate_paint_estimate_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_paint_estimate_duplicates` | Group items with the same category and normalized name. |
| `measure_paint_estimate_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_paint_estimate_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_paint_estimate_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_paint_estimate_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_paint_estimate_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_paint_estimate_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_paint_estimate_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_paint_estimate_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_paint_estimate_next_steps` | Recommend the next five actions with quick wins. |
| `open_paint_estimate_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
