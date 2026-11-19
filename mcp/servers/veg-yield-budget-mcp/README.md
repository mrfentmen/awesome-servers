# Veg Yield Budget Audit

Veg Yield Budget Audit: turn yield and refuse figures into buy amounts and cost. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/veg-yield-budget-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "veg-yield-budget-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/veg-yield-budget-mcp"]
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
      "id": "veg_yield-sample-1",
      "name": "Sample leafy veg entry",
      "category": "leafy",
      "tags": [
        "vegetable"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "veg_yield-sample-2",
      "name": "Sample roots entry",
      "category": "root",
      "tags": [
        "vegetable"
      ],
      "cost": 30,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_veg_yield` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_veg_yield_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_veg_yield_coverage` | Show category coverage ratios and unknown categories. |
| `flag_veg_yield_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_veg_yield_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_veg_yield_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_veg_yield_baseline` | Compare category counts with the configured baseline. |
| `estimate_veg_yield_cost_per_use` | Calculate the primary metric for every item with mean and pass count. |
| `find_veg_yield_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_veg_yield_dependencies` | Map dependency groups and show which ones are missing. |
| `test_veg_yield_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_veg_yield_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_veg_yield_fixes` | Rank fixes by impact divided by effort. |
| `validate_veg_yield_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_veg_yield_duplicates` | Group items with the same category and normalized name. |
| `measure_veg_yield_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_veg_yield_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_veg_yield_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_veg_yield_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_veg_yield_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_veg_yield_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_veg_yield_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_veg_yield_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_veg_yield_next_steps` | Recommend the next five actions with quick wins. |
| `open_veg_yield_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
