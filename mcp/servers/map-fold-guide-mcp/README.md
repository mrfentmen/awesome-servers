# Map Fold Guide Tracker

Real local JSON analysis of map fold guide in the Map Fold lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/map-fold-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "map-fold-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/map-fold-guide-mcp"]
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
      "id": "map_fold_map_fold_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "map-fold",
        "map",
        "fold"
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
      "id": "map_fold_map_fold_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "map-fold",
        "map",
        "fold"
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
| `inventory_map_fold_map_fold_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_map_fold_map_fold_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_map_fold_map_fold_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_map_fold_map_fold_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_map_fold_map_fold_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_map_fold_map_fold_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_map_fold_map_fold_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_map_fold_map_fold_guide_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_map_fold_map_fold_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_map_fold_map_fold_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_map_fold_map_fold_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_map_fold_map_fold_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_map_fold_map_fold_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_map_fold_map_fold_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_map_fold_map_fold_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_map_fold_map_fold_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_map_fold_map_fold_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_map_fold_map_fold_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_map_fold_map_fold_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_map_fold_map_fold_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_map_fold_map_fold_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_map_fold_map_fold_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_map_fold_map_fold_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_map_fold_map_fold_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_map_fold_map_fold_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
