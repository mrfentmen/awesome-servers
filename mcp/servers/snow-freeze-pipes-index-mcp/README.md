# Freeze Pipes Archive

Archive freeze pipes by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/snow-freeze-pipes-index-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "snow-freeze-pipes-index-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/snow-freeze-pipes-index-mcp"]
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
      "id": "freeze_pipes_index-pipe-insulation",
      "name": "Pipe insulation",
      "category": "insulation",
      "tags": [
        "insulation"
      ],
      "cost": 30,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "freeze_pipes_index-heat-tape",
      "name": "Heat tape",
      "category": "heat",
      "tags": [
        "heat"
      ],
      "cost": 40,
      "quantity": 12,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_freeze_pipes_index` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_freeze_pipes_index_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_freeze_pipes_index_coverage` | Show category coverage ratios and unknown categories. |
| `flag_freeze_pipes_index_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_freeze_pipes_index_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_freeze_pipes_index_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_freeze_pipes_index_baseline` | Compare category counts with the configured baseline. |
| `estimate_freeze_pipes_index_insulated_length` | Calculate the primary metric for every item with mean and pass count. |
| `find_freeze_pipes_index_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_freeze_pipes_index_dependencies` | Map dependency groups and show which ones are missing. |
| `test_freeze_pipes_index_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_freeze_pipes_index_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_freeze_pipes_index_fixes` | Rank fixes by impact divided by effort. |
| `validate_freeze_pipes_index_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_freeze_pipes_index_duplicates` | Group items with the same category and normalized name. |
| `measure_freeze_pipes_index_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_freeze_pipes_index_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_freeze_pipes_index_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_freeze_pipes_index_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_freeze_pipes_index_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_freeze_pipes_index_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_freeze_pipes_index_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_freeze_pipes_index_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_freeze_pipes_index_next_steps` | Recommend the next five actions with quick wins. |
| `open_freeze_pipes_index_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
