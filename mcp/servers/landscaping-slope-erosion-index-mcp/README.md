# Slope Erosion Archive

Archive slope erosion by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/landscaping-slope-erosion-index-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "landscaping-slope-erosion-index-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/landscaping-slope-erosion-index-mcp"]
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
      "id": "slope_erosion_index-thyme",
      "name": "Creeping thyme",
      "category": "groundcover",
      "tags": [
        "perennial",
        "low"
      ],
      "cost": 60,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "slope_erosion_index-blanket",
      "name": "Erosion blanket",
      "category": "groundcover",
      "tags": [
        "jute",
        "temporary"
      ],
      "cost": 120,
      "quantity": 30,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_slope_erosion_index` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_slope_erosion_index_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_slope_erosion_index_coverage` | Show category coverage ratios and unknown categories. |
| `flag_slope_erosion_index_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_slope_erosion_index_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_slope_erosion_index_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_slope_erosion_index_baseline` | Compare category counts with the configured baseline. |
| `estimate_slope_erosion_index_erosion_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_slope_erosion_index_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_slope_erosion_index_dependencies` | Map dependency groups and show which ones are missing. |
| `test_slope_erosion_index_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_slope_erosion_index_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_slope_erosion_index_fixes` | Rank fixes by impact divided by effort. |
| `validate_slope_erosion_index_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_slope_erosion_index_duplicates` | Group items with the same category and normalized name. |
| `measure_slope_erosion_index_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_slope_erosion_index_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_slope_erosion_index_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_slope_erosion_index_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_slope_erosion_index_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_slope_erosion_index_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_slope_erosion_index_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_slope_erosion_index_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_slope_erosion_index_next_steps` | Recommend the next five actions with quick wins. |
| `open_slope_erosion_index_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
