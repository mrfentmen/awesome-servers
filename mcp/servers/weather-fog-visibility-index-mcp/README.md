# Fog Visibility Archive

Archive fog visibility by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/weather-fog-visibility-index-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "weather-fog-visibility-index-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/weather-fog-visibility-index-mcp"]
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
      "id": "fog_visibility_index-route-visibility",
      "name": "Route visibility",
      "category": "route",
      "tags": [
        "route"
      ],
      "cost": 0,
      "quantity": 300,
      "condition": "fair"
    },
    {
      "id": "fog_visibility_index-fog-lights",
      "name": "Fog lights",
      "category": "lights",
      "tags": [
        "lights"
      ],
      "cost": 120,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_fog_visibility_index` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_fog_visibility_index_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_fog_visibility_index_coverage` | Show category coverage ratios and unknown categories. |
| `flag_fog_visibility_index_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_fog_visibility_index_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_fog_visibility_index_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_fog_visibility_index_baseline` | Compare category counts with the configured baseline. |
| `estimate_fog_visibility_index_visibility_ft` | Calculate the primary metric for every item with mean and pass count. |
| `find_fog_visibility_index_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_fog_visibility_index_dependencies` | Map dependency groups and show which ones are missing. |
| `test_fog_visibility_index_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_fog_visibility_index_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_fog_visibility_index_fixes` | Rank fixes by impact divided by effort. |
| `validate_fog_visibility_index_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_fog_visibility_index_duplicates` | Group items with the same category and normalized name. |
| `measure_fog_visibility_index_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_fog_visibility_index_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_fog_visibility_index_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_fog_visibility_index_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_fog_visibility_index_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_fog_visibility_index_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_fog_visibility_index_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_fog_visibility_index_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_fog_visibility_index_next_steps` | Recommend the next five actions with quick wins. |
| `open_fog_visibility_index_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
