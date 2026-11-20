# Mosquito Yard Dump Planner

Real local JSON analysis of mosquito yard dump in the Pest Control lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/pest-control-mosquito-yard-dump-plan-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "pest-control-mosquito-yard-dump-plan-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/pest-control-mosquito-yard-dump-plan-mcp"]
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
      "id": "pest_control_pest_control_mosquito_yard_dump_plan-goals-1",
      "name": "Goals primary",
      "category": "goals",
      "tags": [
        "pest-control",
        "pest",
        "control"
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
      "id": "pest_control_pest_control_mosquito_yard_dump_plan-schedule-2",
      "name": "Schedule primary",
      "category": "schedule",
      "tags": [
        "pest-control",
        "pest",
        "control"
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
| `inventory_pest_control_pest_control_mosquito_yard_dump_plan` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_pest_control_pest_control_mosquito_yard_dump_plan_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_pest_control_pest_control_mosquito_yard_dump_plan_coverage` | Show category coverage ratios and unknown categories. |
| `flag_pest_control_pest_control_mosquito_yard_dump_plan_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_pest_control_pest_control_mosquito_yard_dump_plan_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_pest_control_pest_control_mosquito_yard_dump_plan_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_pest_control_pest_control_mosquito_yard_dump_plan_baseline` | Compare category counts with the configured baseline. |
| `estimate_pest_control_pest_control_mosquito_yard_dump_plan_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_pest_control_pest_control_mosquito_yard_dump_plan_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_pest_control_pest_control_mosquito_yard_dump_plan_dependencies` | Map dependency groups and show which ones are missing. |
| `test_pest_control_pest_control_mosquito_yard_dump_plan_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_pest_control_pest_control_mosquito_yard_dump_plan_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_pest_control_pest_control_mosquito_yard_dump_plan_fixes` | Rank fixes by impact divided by effort. |
| `validate_pest_control_pest_control_mosquito_yard_dump_plan_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_pest_control_pest_control_mosquito_yard_dump_plan_duplicates` | Group items with the same category and normalized name. |
| `measure_pest_control_pest_control_mosquito_yard_dump_plan_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_pest_control_pest_control_mosquito_yard_dump_plan_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_pest_control_pest_control_mosquito_yard_dump_plan_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_pest_control_pest_control_mosquito_yard_dump_plan_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_pest_control_pest_control_mosquito_yard_dump_plan_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_pest_control_pest_control_mosquito_yard_dump_plan_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_pest_control_pest_control_mosquito_yard_dump_plan_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_pest_control_pest_control_mosquito_yard_dump_plan_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_pest_control_pest_control_mosquito_yard_dump_plan_next_steps` | Recommend the next five actions with quick wins. |
| `open_pest_control_pest_control_mosquito_yard_dump_plan_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
