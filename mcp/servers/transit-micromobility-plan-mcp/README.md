# Micromobility Planning Audit

Plan micromobility by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/transit-micromobility-plan-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "transit-micromobility-plan-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/transit-micromobility-plan-mcp"]
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
      "id": "micromobility_plan-scooter",
      "name": "Scooter ride",
      "category": "scooter",
      "tags": [
        "unlock",
        "short-trip"
      ],
      "cost": 3.5,
      "quantity": 3.5,
      "condition": "good"
    },
    {
      "id": "micromobility_plan-scooter-pass",
      "name": "Scooter pass",
      "category": "scooter",
      "tags": [
        "monthly",
        "commute"
      ],
      "cost": 4,
      "quantity": 4,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_micromobility_plan` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_micromobility_plan_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_micromobility_plan_coverage` | Show category coverage ratios and unknown categories. |
| `flag_micromobility_plan_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_micromobility_plan_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_micromobility_plan_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_micromobility_plan_baseline` | Compare category counts with the configured baseline. |
| `estimate_micromobility_plan_cost_per_trip_usd` | Calculate the primary metric for every item with mean and pass count. |
| `find_micromobility_plan_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_micromobility_plan_dependencies` | Map dependency groups and show which ones are missing. |
| `test_micromobility_plan_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_micromobility_plan_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_micromobility_plan_fixes` | Rank fixes by impact divided by effort. |
| `validate_micromobility_plan_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_micromobility_plan_duplicates` | Group items with the same category and normalized name. |
| `measure_micromobility_plan_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_micromobility_plan_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_micromobility_plan_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_micromobility_plan_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_micromobility_plan_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_micromobility_plan_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_micromobility_plan_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_micromobility_plan_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_micromobility_plan_next_steps` | Recommend the next five actions with quick wins. |
| `open_micromobility_plan_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
