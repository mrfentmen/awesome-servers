# Spare Tire Change Planner

Real local JSON analysis of spare tire change in the Spare Tire lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/spare-tire-change-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "spare-tire-change-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/spare-tire-change-mcp"]
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
      "id": "spare_tire_spare_tire_change-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "spare-tire",
        "spare",
        "tire"
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
      "id": "spare_tire_spare_tire_change-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "spare-tire",
        "spare",
        "tire"
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
| `inventory_spare_tire_spare_tire_change` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_spare_tire_spare_tire_change_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_spare_tire_spare_tire_change_coverage` | Show category coverage ratios and unknown categories. |
| `flag_spare_tire_spare_tire_change_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_spare_tire_spare_tire_change_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_spare_tire_spare_tire_change_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_spare_tire_spare_tire_change_baseline` | Compare category counts with the configured baseline. |
| `estimate_spare_tire_spare_tire_change_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_spare_tire_spare_tire_change_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_spare_tire_spare_tire_change_dependencies` | Map dependency groups and show which ones are missing. |
| `test_spare_tire_spare_tire_change_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_spare_tire_spare_tire_change_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_spare_tire_spare_tire_change_fixes` | Rank fixes by impact divided by effort. |
| `validate_spare_tire_spare_tire_change_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_spare_tire_spare_tire_change_duplicates` | Group items with the same category and normalized name. |
| `measure_spare_tire_spare_tire_change_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_spare_tire_spare_tire_change_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_spare_tire_spare_tire_change_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_spare_tire_spare_tire_change_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_spare_tire_spare_tire_change_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_spare_tire_spare_tire_change_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_spare_tire_spare_tire_change_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_spare_tire_spare_tire_change_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_spare_tire_spare_tire_change_next_steps` | Recommend the next five actions with quick wins. |
| `open_spare_tire_spare_tire_change_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
