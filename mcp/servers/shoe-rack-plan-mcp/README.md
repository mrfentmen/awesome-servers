# Shoe Rack Plan Planner

Real local JSON analysis of shoe rack plan in the Shoe Rack lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/shoe-rack-plan-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "shoe-rack-plan-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/shoe-rack-plan-mcp"]
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
      "id": "shoe_rack_shoe_rack_plan-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "shoe-rack",
        "shoe",
        "rack"
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
      "id": "shoe_rack_shoe_rack_plan-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "shoe-rack",
        "shoe",
        "rack"
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
| `inventory_shoe_rack_shoe_rack_plan` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_shoe_rack_shoe_rack_plan_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_shoe_rack_shoe_rack_plan_coverage` | Show category coverage ratios and unknown categories. |
| `flag_shoe_rack_shoe_rack_plan_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_shoe_rack_shoe_rack_plan_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_shoe_rack_shoe_rack_plan_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_shoe_rack_shoe_rack_plan_baseline` | Compare category counts with the configured baseline. |
| `estimate_shoe_rack_shoe_rack_plan_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_shoe_rack_shoe_rack_plan_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_shoe_rack_shoe_rack_plan_dependencies` | Map dependency groups and show which ones are missing. |
| `test_shoe_rack_shoe_rack_plan_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_shoe_rack_shoe_rack_plan_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_shoe_rack_shoe_rack_plan_fixes` | Rank fixes by impact divided by effort. |
| `validate_shoe_rack_shoe_rack_plan_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_shoe_rack_shoe_rack_plan_duplicates` | Group items with the same category and normalized name. |
| `measure_shoe_rack_shoe_rack_plan_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_shoe_rack_shoe_rack_plan_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_shoe_rack_shoe_rack_plan_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_shoe_rack_shoe_rack_plan_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_shoe_rack_shoe_rack_plan_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_shoe_rack_shoe_rack_plan_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_shoe_rack_shoe_rack_plan_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_shoe_rack_shoe_rack_plan_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_shoe_rack_shoe_rack_plan_next_steps` | Recommend the next five actions with quick wins. |
| `open_shoe_rack_shoe_rack_plan_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
