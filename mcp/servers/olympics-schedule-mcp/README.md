# Olympics Schedule Compare

Real local JSON analysis of olympics schedule in the Olympics Schedule lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/olympics-schedule-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "olympics-schedule-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/olympics-schedule-mcp"]
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
      "id": "olympics_schedule_olympics_schedule-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "olympics-schedule",
        "olympics",
        "schedule"
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
      "id": "olympics_schedule_olympics_schedule-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "olympics-schedule",
        "olympics",
        "schedule"
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
| `inventory_olympics_schedule_olympics_schedule` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_olympics_schedule_olympics_schedule_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_olympics_schedule_olympics_schedule_coverage` | Show category coverage ratios and unknown categories. |
| `flag_olympics_schedule_olympics_schedule_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_olympics_schedule_olympics_schedule_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_olympics_schedule_olympics_schedule_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_olympics_schedule_olympics_schedule_baseline` | Compare category counts with the configured baseline. |
| `estimate_olympics_schedule_olympics_schedule_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_olympics_schedule_olympics_schedule_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_olympics_schedule_olympics_schedule_dependencies` | Map dependency groups and show which ones are missing. |
| `test_olympics_schedule_olympics_schedule_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_olympics_schedule_olympics_schedule_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_olympics_schedule_olympics_schedule_fixes` | Rank fixes by impact divided by effort. |
| `validate_olympics_schedule_olympics_schedule_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_olympics_schedule_olympics_schedule_duplicates` | Group items with the same category and normalized name. |
| `measure_olympics_schedule_olympics_schedule_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_olympics_schedule_olympics_schedule_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_olympics_schedule_olympics_schedule_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_olympics_schedule_olympics_schedule_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_olympics_schedule_olympics_schedule_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_olympics_schedule_olympics_schedule_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_olympics_schedule_olympics_schedule_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_olympics_schedule_olympics_schedule_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_olympics_schedule_olympics_schedule_next_steps` | Recommend the next five actions with quick wins. |
| `open_olympics_schedule_olympics_schedule_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
