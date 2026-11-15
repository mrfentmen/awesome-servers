# Bus Reliability Budget Audit

Audit bus reliability budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/transit-bus-reliability-cost-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "transit-bus-reliability-cost-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/transit-bus-reliability-cost-mcp"]
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
      "id": "bus_reliability_budget-downtown-bus",
      "name": "Downtown bus",
      "category": "bus",
      "tags": [
        "budget"
      ],
      "cost": 3,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "bus_reliability_budget-commuter-rail",
      "name": "Commuter rail",
      "category": "rail",
      "tags": [
        "budget"
      ],
      "cost": 6,
      "quantity": 6,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_bus_reliability_budget` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_bus_reliability_budget_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_bus_reliability_budget_coverage` | Show category coverage ratios and unknown categories. |
| `flag_bus_reliability_budget_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_bus_reliability_budget_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_bus_reliability_budget_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_bus_reliability_budget_baseline` | Compare category counts with the configured baseline. |
| `estimate_bus_reliability_budget_line_cost` | Calculate the primary metric for every item with mean and pass count. |
| `find_bus_reliability_budget_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_bus_reliability_budget_dependencies` | Map dependency groups and show which ones are missing. |
| `test_bus_reliability_budget_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_bus_reliability_budget_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_bus_reliability_budget_fixes` | Rank fixes by impact divided by effort. |
| `validate_bus_reliability_budget_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_bus_reliability_budget_duplicates` | Group items with the same category and normalized name. |
| `measure_bus_reliability_budget_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_bus_reliability_budget_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_bus_reliability_budget_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_bus_reliability_budget_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_bus_reliability_budget_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_bus_reliability_budget_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_bus_reliability_budget_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_bus_reliability_budget_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_bus_reliability_budget_next_steps` | Recommend the next five actions with quick wins. |
| `open_bus_reliability_budget_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
