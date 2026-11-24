# Pruning Shear Clean Audit

Real local JSON analysis of pruning shear clean in the Jungle Shelf lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/pruning-shear-clean-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "pruning-shear-clean-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/pruning-shear-clean-mcp"]
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
      "id": "jungle_shelf_pruning_shear_clean-steps-1",
      "name": "Steps primary",
      "category": "steps",
      "tags": [
        "jungle-shelf",
        "pruning",
        "shear"
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
      "id": "jungle_shelf_pruning_shear_clean-tools-2",
      "name": "Tools primary",
      "category": "tools",
      "tags": [
        "jungle-shelf",
        "pruning",
        "shear"
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
| `inventory_jungle_shelf_pruning_shear_clean` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_jungle_shelf_pruning_shear_clean_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_jungle_shelf_pruning_shear_clean_coverage` | Show category coverage ratios and unknown categories. |
| `flag_jungle_shelf_pruning_shear_clean_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_jungle_shelf_pruning_shear_clean_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_jungle_shelf_pruning_shear_clean_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_jungle_shelf_pruning_shear_clean_baseline` | Compare category counts with the configured baseline. |
| `estimate_jungle_shelf_pruning_shear_clean_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_jungle_shelf_pruning_shear_clean_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_jungle_shelf_pruning_shear_clean_dependencies` | Map dependency groups and show which ones are missing. |
| `test_jungle_shelf_pruning_shear_clean_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_jungle_shelf_pruning_shear_clean_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_jungle_shelf_pruning_shear_clean_fixes` | Rank fixes by impact divided by effort. |
| `validate_jungle_shelf_pruning_shear_clean_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_jungle_shelf_pruning_shear_clean_duplicates` | Group items with the same category and normalized name. |
| `measure_jungle_shelf_pruning_shear_clean_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_jungle_shelf_pruning_shear_clean_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_jungle_shelf_pruning_shear_clean_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_jungle_shelf_pruning_shear_clean_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_jungle_shelf_pruning_shear_clean_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_jungle_shelf_pruning_shear_clean_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_jungle_shelf_pruning_shear_clean_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_jungle_shelf_pruning_shear_clean_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_jungle_shelf_pruning_shear_clean_next_steps` | Recommend the next five actions with quick wins. |
| `open_jungle_shelf_pruning_shear_clean_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
