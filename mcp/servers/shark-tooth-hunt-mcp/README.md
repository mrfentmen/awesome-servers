# Shark Tooth Hunt Simulator

Real local JSON analysis of shark tooth hunt in the Shark Tooth lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/shark-tooth-hunt-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "shark-tooth-hunt-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/shark-tooth-hunt-mcp"]
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
      "id": "shark_tooth_shark_tooth_hunt-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "shark-tooth",
        "shark",
        "tooth"
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
      "id": "shark_tooth_shark_tooth_hunt-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "shark-tooth",
        "shark",
        "tooth"
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
| `inventory_shark_tooth_shark_tooth_hunt` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_shark_tooth_shark_tooth_hunt_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_shark_tooth_shark_tooth_hunt_coverage` | Show category coverage ratios and unknown categories. |
| `flag_shark_tooth_shark_tooth_hunt_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_shark_tooth_shark_tooth_hunt_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_shark_tooth_shark_tooth_hunt_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_shark_tooth_shark_tooth_hunt_baseline` | Compare category counts with the configured baseline. |
| `estimate_shark_tooth_shark_tooth_hunt_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_shark_tooth_shark_tooth_hunt_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_shark_tooth_shark_tooth_hunt_dependencies` | Map dependency groups and show which ones are missing. |
| `test_shark_tooth_shark_tooth_hunt_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_shark_tooth_shark_tooth_hunt_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_shark_tooth_shark_tooth_hunt_fixes` | Rank fixes by impact divided by effort. |
| `validate_shark_tooth_shark_tooth_hunt_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_shark_tooth_shark_tooth_hunt_duplicates` | Group items with the same category and normalized name. |
| `measure_shark_tooth_shark_tooth_hunt_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_shark_tooth_shark_tooth_hunt_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_shark_tooth_shark_tooth_hunt_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_shark_tooth_shark_tooth_hunt_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_shark_tooth_shark_tooth_hunt_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_shark_tooth_shark_tooth_hunt_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_shark_tooth_shark_tooth_hunt_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_shark_tooth_shark_tooth_hunt_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_shark_tooth_shark_tooth_hunt_next_steps` | Recommend the next five actions with quick wins. |
| `open_shark_tooth_shark_tooth_hunt_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
