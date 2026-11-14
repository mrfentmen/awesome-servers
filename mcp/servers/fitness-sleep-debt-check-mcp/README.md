# Sleep Debt Audit

Audit weekday, weekend, nap and bedtime sleep hours for debt and consistency. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/fitness-sleep-debt-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "fitness-sleep-debt-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/fitness-sleep-debt-check-mcp"]
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
      "id": "sleep-weekday",
      "name": "Monday night",
      "category": "weekday",
      "tags": [
        "worknight"
      ],
      "cost": 0,
      "quantity": 6.5,
      "condition": "fair"
    },
    {
      "id": "sleep-weekend",
      "name": "Saturday night",
      "category": "weekend",
      "tags": [
        "recovery"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_sleep_debt` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_sleep_debt_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_sleep_debt_coverage` | Show category coverage ratios and unknown categories. |
| `flag_sleep_debt_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_sleep_debt_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_sleep_debt_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_sleep_debt_baseline` | Compare category counts with the configured baseline. |
| `estimate_sleep_debt_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_sleep_debt_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_sleep_debt_dependencies` | Map dependency groups and show which ones are missing. |
| `test_sleep_debt_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_sleep_debt_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_sleep_debt_fixes` | Rank fixes by impact divided by effort. |
| `validate_sleep_debt_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_sleep_debt_duplicates` | Group items with the same category and normalized name. |
| `measure_sleep_debt_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_sleep_debt_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_sleep_debt_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_sleep_debt_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_sleep_debt_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_sleep_debt_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_sleep_debt_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_sleep_debt_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_sleep_debt_next_steps` | Recommend the next five actions with quick wins. |
| `open_sleep_debt_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
