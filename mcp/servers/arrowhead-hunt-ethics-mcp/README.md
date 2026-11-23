# Arrowhead Hunt Ethics Compare

Real local JSON analysis of arrowhead hunt ethics in the Arrowhead Hunt lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/arrowhead-hunt-ethics-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "arrowhead-hunt-ethics-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/arrowhead-hunt-ethics-mcp"]
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
      "id": "arrowhead_hunt_arrowhead_hunt_ethics-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "arrowhead-hunt",
        "arrowhead",
        "hunt"
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
      "id": "arrowhead_hunt_arrowhead_hunt_ethics-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "arrowhead-hunt",
        "arrowhead",
        "hunt"
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
| `inventory_arrowhead_hunt_arrowhead_hunt_ethics` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_arrowhead_hunt_arrowhead_hunt_ethics_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_arrowhead_hunt_arrowhead_hunt_ethics_coverage` | Show category coverage ratios and unknown categories. |
| `flag_arrowhead_hunt_arrowhead_hunt_ethics_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_arrowhead_hunt_arrowhead_hunt_ethics_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_arrowhead_hunt_arrowhead_hunt_ethics_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_arrowhead_hunt_arrowhead_hunt_ethics_baseline` | Compare category counts with the configured baseline. |
| `estimate_arrowhead_hunt_arrowhead_hunt_ethics_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_arrowhead_hunt_arrowhead_hunt_ethics_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_arrowhead_hunt_arrowhead_hunt_ethics_dependencies` | Map dependency groups and show which ones are missing. |
| `test_arrowhead_hunt_arrowhead_hunt_ethics_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_arrowhead_hunt_arrowhead_hunt_ethics_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_arrowhead_hunt_arrowhead_hunt_ethics_fixes` | Rank fixes by impact divided by effort. |
| `validate_arrowhead_hunt_arrowhead_hunt_ethics_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_arrowhead_hunt_arrowhead_hunt_ethics_duplicates` | Group items with the same category and normalized name. |
| `measure_arrowhead_hunt_arrowhead_hunt_ethics_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_arrowhead_hunt_arrowhead_hunt_ethics_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_arrowhead_hunt_arrowhead_hunt_ethics_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_arrowhead_hunt_arrowhead_hunt_ethics_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_arrowhead_hunt_arrowhead_hunt_ethics_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_arrowhead_hunt_arrowhead_hunt_ethics_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_arrowhead_hunt_arrowhead_hunt_ethics_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_arrowhead_hunt_arrowhead_hunt_ethics_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_arrowhead_hunt_arrowhead_hunt_ethics_next_steps` | Recommend the next five actions with quick wins. |
| `open_arrowhead_hunt_arrowhead_hunt_ethics_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
