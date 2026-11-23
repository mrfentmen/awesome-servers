# Kroger Pickup Scheduler Tracker

Real local JSON analysis of kroger pickup scheduler in the Kroger Pickup lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/kroger-pickup-scheduler-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "kroger-pickup-scheduler-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/kroger-pickup-scheduler-mcp"]
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
      "id": "kroger_pickup_kroger_pickup_scheduler-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "kroger-pickup",
        "kroger",
        "pickup"
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
      "id": "kroger_pickup_kroger_pickup_scheduler-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "kroger-pickup",
        "kroger",
        "pickup"
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
| `inventory_kroger_pickup_kroger_pickup_scheduler` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_kroger_pickup_kroger_pickup_scheduler_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_kroger_pickup_kroger_pickup_scheduler_coverage` | Show category coverage ratios and unknown categories. |
| `flag_kroger_pickup_kroger_pickup_scheduler_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_kroger_pickup_kroger_pickup_scheduler_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_kroger_pickup_kroger_pickup_scheduler_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_kroger_pickup_kroger_pickup_scheduler_baseline` | Compare category counts with the configured baseline. |
| `estimate_kroger_pickup_kroger_pickup_scheduler_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_kroger_pickup_kroger_pickup_scheduler_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_kroger_pickup_kroger_pickup_scheduler_dependencies` | Map dependency groups and show which ones are missing. |
| `test_kroger_pickup_kroger_pickup_scheduler_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_kroger_pickup_kroger_pickup_scheduler_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_kroger_pickup_kroger_pickup_scheduler_fixes` | Rank fixes by impact divided by effort. |
| `validate_kroger_pickup_kroger_pickup_scheduler_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_kroger_pickup_kroger_pickup_scheduler_duplicates` | Group items with the same category and normalized name. |
| `measure_kroger_pickup_kroger_pickup_scheduler_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_kroger_pickup_kroger_pickup_scheduler_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_kroger_pickup_kroger_pickup_scheduler_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_kroger_pickup_kroger_pickup_scheduler_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_kroger_pickup_kroger_pickup_scheduler_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_kroger_pickup_kroger_pickup_scheduler_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_kroger_pickup_kroger_pickup_scheduler_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_kroger_pickup_kroger_pickup_scheduler_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_kroger_pickup_kroger_pickup_scheduler_next_steps` | Recommend the next five actions with quick wins. |
| `open_kroger_pickup_kroger_pickup_scheduler_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
