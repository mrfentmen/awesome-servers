# Small Business Week Compare

Real local JSON analysis of small business week in the Small Business lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/small-business-week-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "small-business-week-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/small-business-week-mcp"]
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
      "id": "small_business_small_business_week-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "small-business",
        "small",
        "business"
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
      "id": "small_business_small_business_week-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "small-business",
        "small",
        "business"
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
| `inventory_small_business_small_business_week` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_small_business_small_business_week_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_small_business_small_business_week_coverage` | Show category coverage ratios and unknown categories. |
| `flag_small_business_small_business_week_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_small_business_small_business_week_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_small_business_small_business_week_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_small_business_small_business_week_baseline` | Compare category counts with the configured baseline. |
| `estimate_small_business_small_business_week_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_small_business_small_business_week_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_small_business_small_business_week_dependencies` | Map dependency groups and show which ones are missing. |
| `test_small_business_small_business_week_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_small_business_small_business_week_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_small_business_small_business_week_fixes` | Rank fixes by impact divided by effort. |
| `validate_small_business_small_business_week_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_small_business_small_business_week_duplicates` | Group items with the same category and normalized name. |
| `measure_small_business_small_business_week_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_small_business_small_business_week_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_small_business_small_business_week_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_small_business_small_business_week_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_small_business_small_business_week_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_small_business_small_business_week_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_small_business_small_business_week_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_small_business_small_business_week_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_small_business_small_business_week_next_steps` | Recommend the next five actions with quick wins. |
| `open_small_business_small_business_week_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
