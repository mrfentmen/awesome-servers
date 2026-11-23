# Zillow Home Value Tracker

Real local JSON analysis of zillow home value in the Zillow Home lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/zillow-home-value-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "zillow-home-value-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/zillow-home-value-mcp"]
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
      "id": "zillow_home_zillow_home_value-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "zillow-home",
        "zillow",
        "home"
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
      "id": "zillow_home_zillow_home_value-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "zillow-home",
        "zillow",
        "home"
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
| `inventory_zillow_home_zillow_home_value` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_zillow_home_zillow_home_value_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_zillow_home_zillow_home_value_coverage` | Show category coverage ratios and unknown categories. |
| `flag_zillow_home_zillow_home_value_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_zillow_home_zillow_home_value_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_zillow_home_zillow_home_value_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_zillow_home_zillow_home_value_baseline` | Compare category counts with the configured baseline. |
| `estimate_zillow_home_zillow_home_value_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_zillow_home_zillow_home_value_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_zillow_home_zillow_home_value_dependencies` | Map dependency groups and show which ones are missing. |
| `test_zillow_home_zillow_home_value_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_zillow_home_zillow_home_value_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_zillow_home_zillow_home_value_fixes` | Rank fixes by impact divided by effort. |
| `validate_zillow_home_zillow_home_value_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_zillow_home_zillow_home_value_duplicates` | Group items with the same category and normalized name. |
| `measure_zillow_home_zillow_home_value_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_zillow_home_zillow_home_value_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_zillow_home_zillow_home_value_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_zillow_home_zillow_home_value_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_zillow_home_zillow_home_value_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_zillow_home_zillow_home_value_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_zillow_home_zillow_home_value_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_zillow_home_zillow_home_value_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_zillow_home_zillow_home_value_next_steps` | Recommend the next five actions with quick wins. |
| `open_zillow_home_zillow_home_value_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
