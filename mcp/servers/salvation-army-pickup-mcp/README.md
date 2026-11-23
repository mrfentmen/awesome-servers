# Salvation Army Pickup Compare

Real local JSON analysis of salvation army pickup in the Salvation Army lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/salvation-army-pickup-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "salvation-army-pickup-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/salvation-army-pickup-mcp"]
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
      "id": "salvation_army_salvation_army_pickup-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "salvation-army",
        "salvation",
        "army"
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
      "id": "salvation_army_salvation_army_pickup-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "salvation-army",
        "salvation",
        "army"
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
| `inventory_salvation_army_salvation_army_pickup` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_salvation_army_salvation_army_pickup_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_salvation_army_salvation_army_pickup_coverage` | Show category coverage ratios and unknown categories. |
| `flag_salvation_army_salvation_army_pickup_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_salvation_army_salvation_army_pickup_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_salvation_army_salvation_army_pickup_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_salvation_army_salvation_army_pickup_baseline` | Compare category counts with the configured baseline. |
| `estimate_salvation_army_salvation_army_pickup_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_salvation_army_salvation_army_pickup_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_salvation_army_salvation_army_pickup_dependencies` | Map dependency groups and show which ones are missing. |
| `test_salvation_army_salvation_army_pickup_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_salvation_army_salvation_army_pickup_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_salvation_army_salvation_army_pickup_fixes` | Rank fixes by impact divided by effort. |
| `validate_salvation_army_salvation_army_pickup_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_salvation_army_salvation_army_pickup_duplicates` | Group items with the same category and normalized name. |
| `measure_salvation_army_salvation_army_pickup_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_salvation_army_salvation_army_pickup_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_salvation_army_salvation_army_pickup_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_salvation_army_salvation_army_pickup_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_salvation_army_salvation_army_pickup_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_salvation_army_salvation_army_pickup_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_salvation_army_salvation_army_pickup_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_salvation_army_salvation_army_pickup_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_salvation_army_salvation_army_pickup_next_steps` | Recommend the next five actions with quick wins. |
| `open_salvation_army_salvation_army_pickup_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
