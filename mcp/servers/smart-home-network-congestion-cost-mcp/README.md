# Network Congestion Budget Audit

Audit network congestion budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/smart-home-network-congestion-cost-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "smart-home-network-congestion-cost-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/smart-home-network-congestion-cost-mcp"]
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
      "id": "network_congestion_budget-wi-fi-6-router",
      "name": "Wi-Fi 6 router",
      "category": "router",
      "tags": [
        "budget"
      ],
      "cost": 180,
      "quantity": 180,
      "condition": "good"
    },
    {
      "id": "network_congestion_budget-doorbell-camera",
      "name": "Doorbell camera",
      "category": "camera",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_network_congestion_budget` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_network_congestion_budget_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_network_congestion_budget_coverage` | Show category coverage ratios and unknown categories. |
| `flag_network_congestion_budget_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_network_congestion_budget_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_network_congestion_budget_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_network_congestion_budget_baseline` | Compare category counts with the configured baseline. |
| `estimate_network_congestion_budget_line_cost` | Calculate the primary metric for every item with mean and pass count. |
| `find_network_congestion_budget_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_network_congestion_budget_dependencies` | Map dependency groups and show which ones are missing. |
| `test_network_congestion_budget_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_network_congestion_budget_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_network_congestion_budget_fixes` | Rank fixes by impact divided by effort. |
| `validate_network_congestion_budget_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_network_congestion_budget_duplicates` | Group items with the same category and normalized name. |
| `measure_network_congestion_budget_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_network_congestion_budget_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_network_congestion_budget_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_network_congestion_budget_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_network_congestion_budget_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_network_congestion_budget_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_network_congestion_budget_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_network_congestion_budget_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_network_congestion_budget_next_steps` | Recommend the next five actions with quick wins. |
| `open_network_congestion_budget_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
