# One Hour Ac Repair Tracker

Real local JSON analysis of one hour ac repair in the One Hour lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/one-hour-ac-repair-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "one-hour-ac-repair-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/one-hour-ac-repair-mcp"]
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
      "id": "one_hour_one_hour_ac_repair-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "one-hour",
        "one",
        "hour"
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
      "id": "one_hour_one_hour_ac_repair-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "one-hour",
        "one",
        "hour"
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
| `inventory_one_hour_one_hour_ac_repair` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_one_hour_one_hour_ac_repair_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_one_hour_one_hour_ac_repair_coverage` | Show category coverage ratios and unknown categories. |
| `flag_one_hour_one_hour_ac_repair_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_one_hour_one_hour_ac_repair_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_one_hour_one_hour_ac_repair_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_one_hour_one_hour_ac_repair_baseline` | Compare category counts with the configured baseline. |
| `estimate_one_hour_one_hour_ac_repair_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_one_hour_one_hour_ac_repair_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_one_hour_one_hour_ac_repair_dependencies` | Map dependency groups and show which ones are missing. |
| `test_one_hour_one_hour_ac_repair_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_one_hour_one_hour_ac_repair_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_one_hour_one_hour_ac_repair_fixes` | Rank fixes by impact divided by effort. |
| `validate_one_hour_one_hour_ac_repair_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_one_hour_one_hour_ac_repair_duplicates` | Group items with the same category and normalized name. |
| `measure_one_hour_one_hour_ac_repair_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_one_hour_one_hour_ac_repair_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_one_hour_one_hour_ac_repair_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_one_hour_one_hour_ac_repair_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_one_hour_one_hour_ac_repair_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_one_hour_one_hour_ac_repair_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_one_hour_one_hour_ac_repair_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_one_hour_one_hour_ac_repair_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_one_hour_one_hour_ac_repair_next_steps` | Recommend the next five actions with quick wins. |
| `open_one_hour_one_hour_ac_repair_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
