# State Park Simulator

Simulate state park by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/california-state-park-sim-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "california-state-park-sim-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/california-state-park-sim-mcp"]
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
      "id": "state_park_sim-park-access",
      "name": "Park access",
      "category": "access",
      "tags": [
        "access"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "state_park_sim-trail-map",
      "name": "Trail map",
      "category": "trail",
      "tags": [
        "trail"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_state_park_sim` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_state_park_sim_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_state_park_sim_coverage` | Show category coverage ratios and unknown categories. |
| `flag_state_park_sim_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_state_park_sim_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_state_park_sim_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_state_park_sim_baseline` | Compare category counts with the configured baseline. |
| `estimate_state_park_sim_park_points` | Calculate the primary metric for every item with mean and pass count. |
| `find_state_park_sim_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_state_park_sim_dependencies` | Map dependency groups and show which ones are missing. |
| `test_state_park_sim_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_state_park_sim_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_state_park_sim_fixes` | Rank fixes by impact divided by effort. |
| `validate_state_park_sim_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_state_park_sim_duplicates` | Group items with the same category and normalized name. |
| `measure_state_park_sim_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_state_park_sim_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_state_park_sim_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_state_park_sim_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_state_park_sim_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_state_park_sim_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_state_park_sim_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_state_park_sim_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_state_park_sim_next_steps` | Recommend the next five actions with quick wins. |
| `open_state_park_sim_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
