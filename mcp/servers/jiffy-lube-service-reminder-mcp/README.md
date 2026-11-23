# Jiffy Lube Service Reminder Tracker

Real local JSON analysis of jiffy lube service reminder in the Jiffy Lube lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/jiffy-lube-service-reminder-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "jiffy-lube-service-reminder-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/jiffy-lube-service-reminder-mcp"]
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
      "id": "jiffy_lube_jiffy_lube_service_reminder-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "jiffy-lube",
        "jiffy",
        "lube"
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
      "id": "jiffy_lube_jiffy_lube_service_reminder-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "jiffy-lube",
        "jiffy",
        "lube"
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
| `inventory_jiffy_lube_jiffy_lube_service_reminder` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_jiffy_lube_jiffy_lube_service_reminder_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_jiffy_lube_jiffy_lube_service_reminder_coverage` | Show category coverage ratios and unknown categories. |
| `flag_jiffy_lube_jiffy_lube_service_reminder_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_jiffy_lube_jiffy_lube_service_reminder_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_jiffy_lube_jiffy_lube_service_reminder_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_jiffy_lube_jiffy_lube_service_reminder_baseline` | Compare category counts with the configured baseline. |
| `estimate_jiffy_lube_jiffy_lube_service_reminder_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_jiffy_lube_jiffy_lube_service_reminder_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_jiffy_lube_jiffy_lube_service_reminder_dependencies` | Map dependency groups and show which ones are missing. |
| `test_jiffy_lube_jiffy_lube_service_reminder_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_jiffy_lube_jiffy_lube_service_reminder_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_jiffy_lube_jiffy_lube_service_reminder_fixes` | Rank fixes by impact divided by effort. |
| `validate_jiffy_lube_jiffy_lube_service_reminder_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_jiffy_lube_jiffy_lube_service_reminder_duplicates` | Group items with the same category and normalized name. |
| `measure_jiffy_lube_jiffy_lube_service_reminder_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_jiffy_lube_jiffy_lube_service_reminder_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_jiffy_lube_jiffy_lube_service_reminder_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_jiffy_lube_jiffy_lube_service_reminder_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_jiffy_lube_jiffy_lube_service_reminder_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_jiffy_lube_jiffy_lube_service_reminder_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_jiffy_lube_jiffy_lube_service_reminder_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_jiffy_lube_jiffy_lube_service_reminder_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_jiffy_lube_jiffy_lube_service_reminder_next_steps` | Recommend the next five actions with quick wins. |
| `open_jiffy_lube_jiffy_lube_service_reminder_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
