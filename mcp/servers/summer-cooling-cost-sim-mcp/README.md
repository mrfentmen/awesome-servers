# Cooling Cost Simulator

Simulate cooling cost by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/summer-cooling-cost-sim-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "summer-cooling-cost-sim-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/summer-cooling-cost-sim-mcp"]
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
      "id": "cooling_cost_sim-ac-unit",
      "name": "AC unit",
      "category": "ac",
      "tags": [
        "ac"
      ],
      "cost": 300,
      "quantity": 120,
      "condition": "good"
    },
    {
      "id": "cooling_cost_sim-ceiling-fan",
      "name": "Ceiling fan",
      "category": "fan",
      "tags": [
        "fan"
      ],
      "cost": 120,
      "quantity": 15,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_cooling_cost_sim` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_cooling_cost_sim_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_cooling_cost_sim_coverage` | Show category coverage ratios and unknown categories. |
| `flag_cooling_cost_sim_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_cooling_cost_sim_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_cooling_cost_sim_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_cooling_cost_sim_baseline` | Compare category counts with the configured baseline. |
| `estimate_cooling_cost_sim_monthly_cost` | Calculate the primary metric for every item with mean and pass count. |
| `find_cooling_cost_sim_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_cooling_cost_sim_dependencies` | Map dependency groups and show which ones are missing. |
| `test_cooling_cost_sim_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_cooling_cost_sim_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_cooling_cost_sim_fixes` | Rank fixes by impact divided by effort. |
| `validate_cooling_cost_sim_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_cooling_cost_sim_duplicates` | Group items with the same category and normalized name. |
| `measure_cooling_cost_sim_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_cooling_cost_sim_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_cooling_cost_sim_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_cooling_cost_sim_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_cooling_cost_sim_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_cooling_cost_sim_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_cooling_cost_sim_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_cooling_cost_sim_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_cooling_cost_sim_next_steps` | Recommend the next five actions with quick wins. |
| `open_cooling_cost_sim_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
