# Storm Door Install Simulator

Real local JSON analysis of storm door install in the Storm Door lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/storm-door-install-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "storm-door-install-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/storm-door-install-mcp"]
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
      "id": "storm_door_storm_door_install-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "storm-door",
        "storm",
        "door"
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
      "id": "storm_door_storm_door_install-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "storm-door",
        "storm",
        "door"
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
| `inventory_storm_door_storm_door_install` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_storm_door_storm_door_install_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_storm_door_storm_door_install_coverage` | Show category coverage ratios and unknown categories. |
| `flag_storm_door_storm_door_install_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_storm_door_storm_door_install_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_storm_door_storm_door_install_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_storm_door_storm_door_install_baseline` | Compare category counts with the configured baseline. |
| `estimate_storm_door_storm_door_install_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_storm_door_storm_door_install_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_storm_door_storm_door_install_dependencies` | Map dependency groups and show which ones are missing. |
| `test_storm_door_storm_door_install_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_storm_door_storm_door_install_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_storm_door_storm_door_install_fixes` | Rank fixes by impact divided by effort. |
| `validate_storm_door_storm_door_install_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_storm_door_storm_door_install_duplicates` | Group items with the same category and normalized name. |
| `measure_storm_door_storm_door_install_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_storm_door_storm_door_install_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_storm_door_storm_door_install_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_storm_door_storm_door_install_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_storm_door_storm_door_install_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_storm_door_storm_door_install_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_storm_door_storm_door_install_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_storm_door_storm_door_install_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_storm_door_storm_door_install_next_steps` | Recommend the next five actions with quick wins. |
| `open_storm_door_storm_door_install_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
