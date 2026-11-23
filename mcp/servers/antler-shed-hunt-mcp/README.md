# Antler Shed Hunt Budget

Real local JSON analysis of antler shed hunt in the Antler Shed lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/antler-shed-hunt-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "antler-shed-hunt-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/antler-shed-hunt-mcp"]
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
      "id": "antler_shed_antler_shed_hunt-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "antler-shed",
        "antler",
        "shed"
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
      "id": "antler_shed_antler_shed_hunt-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "antler-shed",
        "antler",
        "shed"
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
| `inventory_antler_shed_antler_shed_hunt` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_antler_shed_antler_shed_hunt_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_antler_shed_antler_shed_hunt_coverage` | Show category coverage ratios and unknown categories. |
| `flag_antler_shed_antler_shed_hunt_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_antler_shed_antler_shed_hunt_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_antler_shed_antler_shed_hunt_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_antler_shed_antler_shed_hunt_baseline` | Compare category counts with the configured baseline. |
| `estimate_antler_shed_antler_shed_hunt_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_antler_shed_antler_shed_hunt_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_antler_shed_antler_shed_hunt_dependencies` | Map dependency groups and show which ones are missing. |
| `test_antler_shed_antler_shed_hunt_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_antler_shed_antler_shed_hunt_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_antler_shed_antler_shed_hunt_fixes` | Rank fixes by impact divided by effort. |
| `validate_antler_shed_antler_shed_hunt_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_antler_shed_antler_shed_hunt_duplicates` | Group items with the same category and normalized name. |
| `measure_antler_shed_antler_shed_hunt_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_antler_shed_antler_shed_hunt_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_antler_shed_antler_shed_hunt_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_antler_shed_antler_shed_hunt_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_antler_shed_antler_shed_hunt_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_antler_shed_antler_shed_hunt_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_antler_shed_antler_shed_hunt_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_antler_shed_antler_shed_hunt_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_antler_shed_antler_shed_hunt_next_steps` | Recommend the next five actions with quick wins. |
| `open_antler_shed_antler_shed_hunt_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
