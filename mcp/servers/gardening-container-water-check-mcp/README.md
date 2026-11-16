# Container Water Audit

Audit container water by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/gardening-container-water-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "gardening-container-water-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/gardening-container-water-check-mcp"]
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
      "id": "container_water-terracotta",
      "name": "Terracotta pot",
      "category": "pot",
      "tags": [
        "terracotta",
        "sun"
      ],
      "cost": 18,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "container_water-succulent",
      "name": "Succulent pot",
      "category": "pot",
      "tags": [
        "succulent",
        "dry"
      ],
      "cost": 12,
      "quantity": 7,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_container_water` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_container_water_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_container_water_coverage` | Show category coverage ratios and unknown categories. |
| `flag_container_water_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_container_water_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_container_water_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_container_water_baseline` | Compare category counts with the configured baseline. |
| `estimate_container_water_water_interval` | Calculate the primary metric for every item with mean and pass count. |
| `find_container_water_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_container_water_dependencies` | Map dependency groups and show which ones are missing. |
| `test_container_water_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_container_water_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_container_water_fixes` | Rank fixes by impact divided by effort. |
| `validate_container_water_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_container_water_duplicates` | Group items with the same category and normalized name. |
| `measure_container_water_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_container_water_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_container_water_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_container_water_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_container_water_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_container_water_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_container_water_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_container_water_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_container_water_next_steps` | Recommend the next five actions with quick wins. |
| `open_container_water_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
