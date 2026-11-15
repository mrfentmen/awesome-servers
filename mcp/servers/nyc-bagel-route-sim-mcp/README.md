# Bagel Route Simulator

Simulate bagel route by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/nyc-bagel-route-sim-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "nyc-bagel-route-sim-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/nyc-bagel-route-sim-mcp"]
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
      "id": "bagel_route_sim-main-bagel-stop",
      "name": "Main bagel stop",
      "category": "stops",
      "tags": [
        "stops"
      ],
      "cost": 6,
      "quantity": 15,
      "condition": "new"
    },
    {
      "id": "bagel_route_sim-backup-bakery",
      "name": "Backup bakery",
      "category": "walk",
      "tags": [
        "walk"
      ],
      "cost": 5,
      "quantity": 12,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_bagel_route_sim` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_bagel_route_sim_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_bagel_route_sim_coverage` | Show category coverage ratios and unknown categories. |
| `flag_bagel_route_sim_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_bagel_route_sim_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_bagel_route_sim_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_bagel_route_sim_baseline` | Compare category counts with the configured baseline. |
| `estimate_bagel_route_sim_route_minutes` | Calculate the primary metric for every item with mean and pass count. |
| `find_bagel_route_sim_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_bagel_route_sim_dependencies` | Map dependency groups and show which ones are missing. |
| `test_bagel_route_sim_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_bagel_route_sim_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_bagel_route_sim_fixes` | Rank fixes by impact divided by effort. |
| `validate_bagel_route_sim_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_bagel_route_sim_duplicates` | Group items with the same category and normalized name. |
| `measure_bagel_route_sim_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_bagel_route_sim_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_bagel_route_sim_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_bagel_route_sim_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_bagel_route_sim_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_bagel_route_sim_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_bagel_route_sim_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_bagel_route_sim_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_bagel_route_sim_next_steps` | Recommend the next five actions with quick wins. |
| `open_bagel_route_sim_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
