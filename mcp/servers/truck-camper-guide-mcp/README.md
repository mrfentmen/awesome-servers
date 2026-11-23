# Truck Camper Guide Matcher

Real local JSON analysis of truck camper guide in the Truck Camper lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/truck-camper-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "truck-camper-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/truck-camper-guide-mcp"]
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
      "id": "truck_camper_truck_camper_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "truck-camper",
        "truck",
        "camper"
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
      "id": "truck_camper_truck_camper_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "truck-camper",
        "truck",
        "camper"
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
| `inventory_truck_camper_truck_camper_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_truck_camper_truck_camper_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_truck_camper_truck_camper_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_truck_camper_truck_camper_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_truck_camper_truck_camper_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_truck_camper_truck_camper_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_truck_camper_truck_camper_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_truck_camper_truck_camper_guide_clearance_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_truck_camper_truck_camper_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_truck_camper_truck_camper_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_truck_camper_truck_camper_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_truck_camper_truck_camper_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_truck_camper_truck_camper_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_truck_camper_truck_camper_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_truck_camper_truck_camper_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_truck_camper_truck_camper_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_truck_camper_truck_camper_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_truck_camper_truck_camper_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_truck_camper_truck_camper_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_truck_camper_truck_camper_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_truck_camper_truck_camper_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_truck_camper_truck_camper_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_truck_camper_truck_camper_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_truck_camper_truck_camper_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_truck_camper_truck_camper_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
