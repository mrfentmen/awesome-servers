# Cross Contamination Audit

Audit boards, knives, containers and fridge storage for raw, cooked and clean separation risk. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/food-cross-contamination-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "food-cross-contamination-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/food-cross-contamination-check-mcp"]
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
      "id": "food-board-raw",
      "name": "Raw meat board",
      "category": "board",
      "tags": [
        "raw",
        "critical"
      ],
      "cost": 15,
      "quantity": 1,
      "acquired": "2025-01-01",
      "condition": "fair"
    },
    {
      "id": "food-board-veg",
      "name": "Vegetable board",
      "category": "board",
      "tags": [
        "clean"
      ],
      "cost": 12,
      "quantity": 1,
      "acquired": "2026-01-01",
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_cross_contamination` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_cross_contamination_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_cross_contamination_coverage` | Show category coverage ratios and unknown categories. |
| `flag_cross_contamination_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_cross_contamination_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_cross_contamination_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_cross_contamination_baseline` | Compare category counts with the configured baseline. |
| `estimate_cross_contamination_dtc_severity` | Calculate the primary metric for every item with mean and pass count. |
| `find_cross_contamination_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_cross_contamination_dependencies` | Map dependency groups and show which ones are missing. |
| `test_cross_contamination_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_cross_contamination_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_cross_contamination_fixes` | Rank fixes by impact divided by effort. |
| `validate_cross_contamination_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_cross_contamination_duplicates` | Group items with the same category and normalized name. |
| `measure_cross_contamination_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_cross_contamination_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_cross_contamination_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_cross_contamination_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_cross_contamination_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_cross_contamination_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_cross_contamination_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_cross_contamination_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_cross_contamination_next_steps` | Recommend the next five actions with quick wins. |
| `open_cross_contamination_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
