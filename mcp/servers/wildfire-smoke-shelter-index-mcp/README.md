# Smoke Shelter Archive

Archive smoke shelter by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/wildfire-smoke-shelter-index-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "wildfire-smoke-shelter-index-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/wildfire-smoke-shelter-index-mcp"]
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
      "id": "smoke_shelter_index-clean-room",
      "name": "Clean room",
      "category": "room",
      "tags": [
        "room"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "smoke_shelter_index-hepa-filter",
      "name": "HEPA filter",
      "category": "filter",
      "tags": [
        "filter"
      ],
      "cost": 250,
      "quantity": 1,
      "condition": "new"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_smoke_shelter_index` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_smoke_shelter_index_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_smoke_shelter_index_coverage` | Show category coverage ratios and unknown categories. |
| `flag_smoke_shelter_index_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_smoke_shelter_index_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_smoke_shelter_index_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_smoke_shelter_index_baseline` | Compare category counts with the configured baseline. |
| `estimate_smoke_shelter_index_clean_air` | Calculate the primary metric for every item with mean and pass count. |
| `find_smoke_shelter_index_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_smoke_shelter_index_dependencies` | Map dependency groups and show which ones are missing. |
| `test_smoke_shelter_index_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_smoke_shelter_index_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_smoke_shelter_index_fixes` | Rank fixes by impact divided by effort. |
| `validate_smoke_shelter_index_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_smoke_shelter_index_duplicates` | Group items with the same category and normalized name. |
| `measure_smoke_shelter_index_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_smoke_shelter_index_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_smoke_shelter_index_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_smoke_shelter_index_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_smoke_shelter_index_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_smoke_shelter_index_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_smoke_shelter_index_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_smoke_shelter_index_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_smoke_shelter_index_next_steps` | Recommend the next five actions with quick wins. |
| `open_smoke_shelter_index_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
