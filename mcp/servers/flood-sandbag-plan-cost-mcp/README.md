# Sandbag Plan Budget Audit

Audit sandbag plan budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/flood-sandbag-plan-cost-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "flood-sandbag-plan-cost-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/flood-sandbag-plan-cost-mcp"]
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
      "id": "sandbag_plan_budget-sandbags",
      "name": "Sandbags",
      "category": "bags",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    },
    {
      "id": "sandbag_plan_budget-sand",
      "name": "Sand",
      "category": "sand",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_sandbag_plan_budget` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_sandbag_plan_budget_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_sandbag_plan_budget_coverage` | Show category coverage ratios and unknown categories. |
| `flag_sandbag_plan_budget_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_sandbag_plan_budget_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_sandbag_plan_budget_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_sandbag_plan_budget_baseline` | Compare category counts with the configured baseline. |
| `estimate_sandbag_plan_budget_line_cost` | Calculate the primary metric for every item with mean and pass count. |
| `find_sandbag_plan_budget_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_sandbag_plan_budget_dependencies` | Map dependency groups and show which ones are missing. |
| `test_sandbag_plan_budget_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_sandbag_plan_budget_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_sandbag_plan_budget_fixes` | Rank fixes by impact divided by effort. |
| `validate_sandbag_plan_budget_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_sandbag_plan_budget_duplicates` | Group items with the same category and normalized name. |
| `measure_sandbag_plan_budget_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_sandbag_plan_budget_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_sandbag_plan_budget_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_sandbag_plan_budget_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_sandbag_plan_budget_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_sandbag_plan_budget_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_sandbag_plan_budget_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_sandbag_plan_budget_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_sandbag_plan_budget_next_steps` | Recommend the next five actions with quick wins. |
| `open_sandbag_plan_budget_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
