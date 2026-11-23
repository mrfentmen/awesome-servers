# Sat Math Sprint Tracker

Real local JSON analysis of sat math sprint in the Test Prep lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/sat-math-sprint-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "sat-math-sprint-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/sat-math-sprint-mcp"]
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
      "id": "test_prep_sat_math_sprint-models-1",
      "name": "Models primary",
      "category": "models",
      "tags": [
        "test-prep",
        "sat",
        "math"
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
      "id": "test_prep_sat_math_sprint-prices-2",
      "name": "Prices primary",
      "category": "prices",
      "tags": [
        "test-prep",
        "sat",
        "math"
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
| `inventory_test_prep_sat_math_sprint` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_test_prep_sat_math_sprint_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_test_prep_sat_math_sprint_coverage` | Show category coverage ratios and unknown categories. |
| `flag_test_prep_sat_math_sprint_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_test_prep_sat_math_sprint_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_test_prep_sat_math_sprint_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_test_prep_sat_math_sprint_baseline` | Compare category counts with the configured baseline. |
| `estimate_test_prep_sat_math_sprint_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_test_prep_sat_math_sprint_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_test_prep_sat_math_sprint_dependencies` | Map dependency groups and show which ones are missing. |
| `test_test_prep_sat_math_sprint_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_test_prep_sat_math_sprint_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_test_prep_sat_math_sprint_fixes` | Rank fixes by impact divided by effort. |
| `validate_test_prep_sat_math_sprint_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_test_prep_sat_math_sprint_duplicates` | Group items with the same category and normalized name. |
| `measure_test_prep_sat_math_sprint_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_test_prep_sat_math_sprint_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_test_prep_sat_math_sprint_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_test_prep_sat_math_sprint_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_test_prep_sat_math_sprint_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_test_prep_sat_math_sprint_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_test_prep_sat_math_sprint_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_test_prep_sat_math_sprint_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_test_prep_sat_math_sprint_next_steps` | Recommend the next five actions with quick wins. |
| `open_test_prep_sat_math_sprint_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
