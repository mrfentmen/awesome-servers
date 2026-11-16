# Puppy Schedule Audit

Audit puppy schedule by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/dogs-puppy-schedule-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "dogs-puppy-schedule-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/dogs-puppy-schedule-check-mcp"]
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
      "id": "puppy_schedule-breakfast",
      "name": "Breakfast",
      "category": "feeding",
      "tags": [
        "7am",
        "puppy"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "puppy_schedule-potty",
      "name": "Potty break",
      "category": "potty",
      "tags": [
        "every-2h",
        "outdoor"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_puppy_schedule` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_puppy_schedule_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_puppy_schedule_coverage` | Show category coverage ratios and unknown categories. |
| `flag_puppy_schedule_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_puppy_schedule_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_puppy_schedule_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_puppy_schedule_baseline` | Compare category counts with the configured baseline. |
| `estimate_puppy_schedule_routine_gaps` | Calculate the primary metric for every item with mean and pass count. |
| `find_puppy_schedule_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_puppy_schedule_dependencies` | Map dependency groups and show which ones are missing. |
| `test_puppy_schedule_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_puppy_schedule_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_puppy_schedule_fixes` | Rank fixes by impact divided by effort. |
| `validate_puppy_schedule_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_puppy_schedule_duplicates` | Group items with the same category and normalized name. |
| `measure_puppy_schedule_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_puppy_schedule_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_puppy_schedule_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_puppy_schedule_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_puppy_schedule_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_puppy_schedule_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_puppy_schedule_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_puppy_schedule_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_puppy_schedule_next_steps` | Recommend the next five actions with quick wins. |
| `open_puppy_schedule_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
