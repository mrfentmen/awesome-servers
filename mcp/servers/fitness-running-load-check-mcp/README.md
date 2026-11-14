# Running Load Audit

Audit running sessions by minutes, category coverage, load balance and recovery gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/fitness-running-load-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "fitness-running-load-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/fitness-running-load-check-mcp"]
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
      "id": "run-easy",
      "name": "Easy zone 2 run",
      "category": "easy",
      "tags": [
        "aerobic"
      ],
      "cost": 0,
      "quantity": 40,
      "condition": "good"
    },
    {
      "id": "run-tempo",
      "name": "Tempo intervals",
      "category": "tempo",
      "tags": [
        "threshold"
      ],
      "cost": 0,
      "quantity": 30,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_running_load` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_running_load_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_running_load_coverage` | Show category coverage ratios and unknown categories. |
| `flag_running_load_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_running_load_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_running_load_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_running_load_baseline` | Compare category counts with the configured baseline. |
| `estimate_running_load_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_running_load_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_running_load_dependencies` | Map dependency groups and show which ones are missing. |
| `test_running_load_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_running_load_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_running_load_fixes` | Rank fixes by impact divided by effort. |
| `validate_running_load_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_running_load_duplicates` | Group items with the same category and normalized name. |
| `measure_running_load_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_running_load_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_running_load_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_running_load_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_running_load_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_running_load_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_running_load_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_running_load_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_running_load_next_steps` | Recommend the next five actions with quick wins. |
| `open_running_load_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
