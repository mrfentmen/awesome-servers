# Soccer Load Archive

Archive soccer load by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/sports-soccer-load-index-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "sports-soccer-load-index-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/sports-soccer-load-index-mcp"]
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
      "id": "soccer-training",
      "name": "Team training",
      "category": "training",
      "tags": [
        "ball"
      ],
      "cost": 0,
      "quantity": 75,
      "condition": "good"
    },
    {
      "id": "soccer-match",
      "name": "League match",
      "category": "match",
      "tags": [
        "match"
      ],
      "cost": 20,
      "quantity": 90,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_soccer_load_index` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_soccer_load_index_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_soccer_load_index_coverage` | Show category coverage ratios and unknown categories. |
| `flag_soccer_load_index_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_soccer_load_index_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_soccer_load_index_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_soccer_load_index_baseline` | Compare category counts with the configured baseline. |
| `estimate_soccer_load_index_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_soccer_load_index_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_soccer_load_index_dependencies` | Map dependency groups and show which ones are missing. |
| `test_soccer_load_index_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_soccer_load_index_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_soccer_load_index_fixes` | Rank fixes by impact divided by effort. |
| `validate_soccer_load_index_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_soccer_load_index_duplicates` | Group items with the same category and normalized name. |
| `measure_soccer_load_index_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_soccer_load_index_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_soccer_load_index_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_soccer_load_index_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_soccer_load_index_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_soccer_load_index_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_soccer_load_index_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_soccer_load_index_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_soccer_load_index_next_steps` | Recommend the next five actions with quick wins. |
| `open_soccer_load_index_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
