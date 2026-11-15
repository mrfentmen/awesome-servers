# Sun Exposure Planning Audit

Plan sun exposure by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/skincare-sun-exposure-plan-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "skincare-sun-exposure-plan-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/skincare-sun-exposure-plan-mcp"]
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
      "id": "sun_exposure_plan-spf50",
      "name": "SPF 50 lotion",
      "category": "spf",
      "tags": [
        "broad-spectrum",
        "daily"
      ],
      "cost": 32,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "sun_exposure_plan-stick",
      "name": "SPF stick",
      "category": "spf",
      "tags": [
        "travel",
        "mineral"
      ],
      "cost": 18,
      "quantity": 70,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_sun_exposure_plan` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_sun_exposure_plan_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_sun_exposure_plan_coverage` | Show category coverage ratios and unknown categories. |
| `flag_sun_exposure_plan_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_sun_exposure_plan_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_sun_exposure_plan_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_sun_exposure_plan_baseline` | Compare category counts with the configured baseline. |
| `estimate_sun_exposure_plan_spf_coverage` | Calculate the primary metric for every item with mean and pass count. |
| `find_sun_exposure_plan_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_sun_exposure_plan_dependencies` | Map dependency groups and show which ones are missing. |
| `test_sun_exposure_plan_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_sun_exposure_plan_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_sun_exposure_plan_fixes` | Rank fixes by impact divided by effort. |
| `validate_sun_exposure_plan_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_sun_exposure_plan_duplicates` | Group items with the same category and normalized name. |
| `measure_sun_exposure_plan_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_sun_exposure_plan_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_sun_exposure_plan_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_sun_exposure_plan_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_sun_exposure_plan_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_sun_exposure_plan_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_sun_exposure_plan_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_sun_exposure_plan_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_sun_exposure_plan_next_steps` | Recommend the next five actions with quick wins. |
| `open_sun_exposure_plan_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
