# Daycare Compare Sheet Planner

Real local JSON analysis of daycare compare sheet in the Baby Prep lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/daycare-compare-sheet-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "daycare-compare-sheet-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/daycare-compare-sheet-mcp"]
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
      "id": "baby_prep_daycare_compare_sheet-rows-1",
      "name": "Rows primary",
      "category": "rows",
      "tags": [
        "baby-prep",
        "daycare",
        "compare"
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
      "id": "baby_prep_daycare_compare_sheet-flags-2",
      "name": "Flags primary",
      "category": "flags",
      "tags": [
        "baby-prep",
        "daycare",
        "compare"
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
| `inventory_baby_prep_daycare_compare_sheet` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_baby_prep_daycare_compare_sheet_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_baby_prep_daycare_compare_sheet_coverage` | Show category coverage ratios and unknown categories. |
| `flag_baby_prep_daycare_compare_sheet_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_baby_prep_daycare_compare_sheet_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_baby_prep_daycare_compare_sheet_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_baby_prep_daycare_compare_sheet_baseline` | Compare category counts with the configured baseline. |
| `estimate_baby_prep_daycare_compare_sheet_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_baby_prep_daycare_compare_sheet_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_baby_prep_daycare_compare_sheet_dependencies` | Map dependency groups and show which ones are missing. |
| `test_baby_prep_daycare_compare_sheet_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_baby_prep_daycare_compare_sheet_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_baby_prep_daycare_compare_sheet_fixes` | Rank fixes by impact divided by effort. |
| `validate_baby_prep_daycare_compare_sheet_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_baby_prep_daycare_compare_sheet_duplicates` | Group items with the same category and normalized name. |
| `measure_baby_prep_daycare_compare_sheet_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_baby_prep_daycare_compare_sheet_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_baby_prep_daycare_compare_sheet_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_baby_prep_daycare_compare_sheet_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_baby_prep_daycare_compare_sheet_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_baby_prep_daycare_compare_sheet_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_baby_prep_daycare_compare_sheet_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_baby_prep_daycare_compare_sheet_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_baby_prep_daycare_compare_sheet_next_steps` | Recommend the next five actions with quick wins. |
| `open_baby_prep_daycare_compare_sheet_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
