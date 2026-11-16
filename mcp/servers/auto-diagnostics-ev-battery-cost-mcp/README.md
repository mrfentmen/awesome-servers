# EV Battery Budget Audit

Audit ev battery budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/auto-diagnostics-ev-battery-cost-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "auto-diagnostics-ev-battery-cost-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/auto-diagnostics-ev-battery-cost-mcp"]
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
      "id": "ev_battery_budget-pack-block-a",
      "name": "Pack block A",
      "category": "cells",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "ev_battery_budget-pack-block-b",
      "name": "Pack block B",
      "category": "cells",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_ev_battery_budget` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_ev_battery_budget_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_ev_battery_budget_coverage` | Show category coverage ratios and unknown categories. |
| `flag_ev_battery_budget_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_ev_battery_budget_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_ev_battery_budget_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_ev_battery_budget_baseline` | Compare category counts with the configured baseline. |
| `estimate_ev_battery_budget_line_cost` | Calculate the primary metric for every item with mean and pass count. |
| `find_ev_battery_budget_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_ev_battery_budget_dependencies` | Map dependency groups and show which ones are missing. |
| `test_ev_battery_budget_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_ev_battery_budget_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_ev_battery_budget_fixes` | Rank fixes by impact divided by effort. |
| `validate_ev_battery_budget_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_ev_battery_budget_duplicates` | Group items with the same category and normalized name. |
| `measure_ev_battery_budget_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_ev_battery_budget_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_ev_battery_budget_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_ev_battery_budget_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_ev_battery_budget_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_ev_battery_budget_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_ev_battery_budget_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_ev_battery_budget_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_ev_battery_budget_next_steps` | Recommend the next five actions with quick wins. |
| `open_ev_battery_budget_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
