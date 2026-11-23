# Outdoor Pizza Dough Compare

Real local JSON analysis of outdoor pizza dough in the Outdoor Pizza lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/outdoor-pizza-dough-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "outdoor-pizza-dough-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/outdoor-pizza-dough-mcp"]
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
      "id": "outdoor_pizza_outdoor_pizza_dough-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "outdoor-pizza",
        "outdoor",
        "pizza"
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
      "id": "outdoor_pizza_outdoor_pizza_dough-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "outdoor-pizza",
        "outdoor",
        "pizza"
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
| `inventory_outdoor_pizza_outdoor_pizza_dough` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_outdoor_pizza_outdoor_pizza_dough_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_outdoor_pizza_outdoor_pizza_dough_coverage` | Show category coverage ratios and unknown categories. |
| `flag_outdoor_pizza_outdoor_pizza_dough_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_outdoor_pizza_outdoor_pizza_dough_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_outdoor_pizza_outdoor_pizza_dough_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_outdoor_pizza_outdoor_pizza_dough_baseline` | Compare category counts with the configured baseline. |
| `estimate_outdoor_pizza_outdoor_pizza_dough_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_outdoor_pizza_outdoor_pizza_dough_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_outdoor_pizza_outdoor_pizza_dough_dependencies` | Map dependency groups and show which ones are missing. |
| `test_outdoor_pizza_outdoor_pizza_dough_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_outdoor_pizza_outdoor_pizza_dough_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_outdoor_pizza_outdoor_pizza_dough_fixes` | Rank fixes by impact divided by effort. |
| `validate_outdoor_pizza_outdoor_pizza_dough_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_outdoor_pizza_outdoor_pizza_dough_duplicates` | Group items with the same category and normalized name. |
| `measure_outdoor_pizza_outdoor_pizza_dough_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_outdoor_pizza_outdoor_pizza_dough_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_outdoor_pizza_outdoor_pizza_dough_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_outdoor_pizza_outdoor_pizza_dough_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_outdoor_pizza_outdoor_pizza_dough_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_outdoor_pizza_outdoor_pizza_dough_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_outdoor_pizza_outdoor_pizza_dough_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_outdoor_pizza_outdoor_pizza_dough_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_outdoor_pizza_outdoor_pizza_dough_next_steps` | Recommend the next five actions with quick wins. |
| `open_outdoor_pizza_outdoor_pizza_dough_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
