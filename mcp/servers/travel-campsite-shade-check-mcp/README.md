# Campsite Shade Audit

Audit campsite options for shade, water, spend and coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/travel-campsite-shade-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "travel-campsite-shade-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/travel-campsite-shade-check-mcp"]
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
      "id": "camp-oak",
      "name": "Oak flat",
      "category": "shaded",
      "tags": [
        "trees"
      ],
      "cost": 30,
      "quantity": 80,
      "condition": "good"
    },
    {
      "id": "camp-pine",
      "name": "Pine ridge",
      "category": "partial",
      "tags": [
        "breeze"
      ],
      "cost": 25,
      "quantity": 45,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_campsite_shade` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_campsite_shade_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_campsite_shade_coverage` | Show category coverage ratios and unknown categories. |
| `flag_campsite_shade_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_campsite_shade_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_campsite_shade_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_campsite_shade_baseline` | Compare category counts with the configured baseline. |
| `estimate_campsite_shade_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_campsite_shade_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_campsite_shade_dependencies` | Map dependency groups and show which ones are missing. |
| `test_campsite_shade_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_campsite_shade_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_campsite_shade_fixes` | Rank fixes by impact divided by effort. |
| `validate_campsite_shade_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_campsite_shade_duplicates` | Group items with the same category and normalized name. |
| `measure_campsite_shade_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_campsite_shade_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_campsite_shade_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_campsite_shade_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_campsite_shade_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_campsite_shade_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_campsite_shade_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_campsite_shade_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_campsite_shade_next_steps` | Recommend the next five actions with quick wins. |
| `open_campsite_shade_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
