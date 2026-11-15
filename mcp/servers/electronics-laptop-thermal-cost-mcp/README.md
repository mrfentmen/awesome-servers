# Laptop Thermal Budget Audit

Audit laptop thermal budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/electronics-laptop-thermal-cost-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "electronics-laptop-thermal-cost-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/electronics-laptop-thermal-cost-mcp"]
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
      "id": "laptop_thermal_budget-idle-desktop",
      "name": "Idle desktop",
      "category": "idle",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "laptop_thermal_budget-browser-with-30-tabs",
      "name": "Browser with 30 tabs",
      "category": "browser",
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
| `inventory_laptop_thermal_budget` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_laptop_thermal_budget_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_laptop_thermal_budget_coverage` | Show category coverage ratios and unknown categories. |
| `flag_laptop_thermal_budget_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_laptop_thermal_budget_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_laptop_thermal_budget_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_laptop_thermal_budget_baseline` | Compare category counts with the configured baseline. |
| `estimate_laptop_thermal_budget_line_cost` | Calculate the primary metric for every item with mean and pass count. |
| `find_laptop_thermal_budget_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_laptop_thermal_budget_dependencies` | Map dependency groups and show which ones are missing. |
| `test_laptop_thermal_budget_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_laptop_thermal_budget_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_laptop_thermal_budget_fixes` | Rank fixes by impact divided by effort. |
| `validate_laptop_thermal_budget_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_laptop_thermal_budget_duplicates` | Group items with the same category and normalized name. |
| `measure_laptop_thermal_budget_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_laptop_thermal_budget_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_laptop_thermal_budget_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_laptop_thermal_budget_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_laptop_thermal_budget_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_laptop_thermal_budget_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_laptop_thermal_budget_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_laptop_thermal_budget_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_laptop_thermal_budget_next_steps` | Recommend the next five actions with quick wins. |
| `open_laptop_thermal_budget_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
