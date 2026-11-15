# Ski Wax Audit

Audit ski wax stock, tuning tools, base care and temperature coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/snow-ski-wax-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "snow-ski-wax-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/snow-ski-wax-check-mcp"]
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
      "id": "ski_wax-all-temp-wax",
      "name": "All-temp wax",
      "category": "wax",
      "tags": [
        "wax"
      ],
      "cost": 20,
      "quantity": 2,
      "condition": "new"
    },
    {
      "id": "ski_wax-wax-iron",
      "name": "Wax iron",
      "category": "tool",
      "tags": [
        "tool"
      ],
      "cost": 60,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_ski_wax` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_ski_wax_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_ski_wax_coverage` | Show category coverage ratios and unknown categories. |
| `flag_ski_wax_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_ski_wax_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_ski_wax_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_ski_wax_baseline` | Compare category counts with the configured baseline. |
| `estimate_ski_wax_wax_stock` | Calculate the primary metric for every item with mean and pass count. |
| `find_ski_wax_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_ski_wax_dependencies` | Map dependency groups and show which ones are missing. |
| `test_ski_wax_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_ski_wax_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_ski_wax_fixes` | Rank fixes by impact divided by effort. |
| `validate_ski_wax_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_ski_wax_duplicates` | Group items with the same category and normalized name. |
| `measure_ski_wax_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_ski_wax_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_ski_wax_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_ski_wax_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_ski_wax_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_ski_wax_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_ski_wax_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_ski_wax_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_ski_wax_next_steps` | Recommend the next five actions with quick wins. |
| `open_ski_wax_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
