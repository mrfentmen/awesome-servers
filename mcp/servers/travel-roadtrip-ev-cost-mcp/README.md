# Road Trip EV Budget Audit

Audit road trip ev budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/travel-roadtrip-ev-cost-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "travel-roadtrip-ev-cost-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/travel-roadtrip-ev-cost-mcp"]
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
      "id": "roadtrip_ev_budget-fast-charger-stop",
      "name": "Fast charger stop",
      "category": "charger",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "roadtrip_ev_budget-highway-route",
      "name": "Highway route",
      "category": "route",
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
| `inventory_roadtrip_ev_budget` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_roadtrip_ev_budget_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_roadtrip_ev_budget_coverage` | Show category coverage ratios and unknown categories. |
| `flag_roadtrip_ev_budget_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_roadtrip_ev_budget_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_roadtrip_ev_budget_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_roadtrip_ev_budget_baseline` | Compare category counts with the configured baseline. |
| `estimate_roadtrip_ev_budget_line_cost` | Calculate the primary metric for every item with mean and pass count. |
| `find_roadtrip_ev_budget_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_roadtrip_ev_budget_dependencies` | Map dependency groups and show which ones are missing. |
| `test_roadtrip_ev_budget_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_roadtrip_ev_budget_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_roadtrip_ev_budget_fixes` | Rank fixes by impact divided by effort. |
| `validate_roadtrip_ev_budget_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_roadtrip_ev_budget_duplicates` | Group items with the same category and normalized name. |
| `measure_roadtrip_ev_budget_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_roadtrip_ev_budget_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_roadtrip_ev_budget_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_roadtrip_ev_budget_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_roadtrip_ev_budget_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_roadtrip_ev_budget_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_roadtrip_ev_budget_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_roadtrip_ev_budget_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_roadtrip_ev_budget_next_steps` | Recommend the next five actions with quick wins. |
| `open_roadtrip_ev_budget_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
