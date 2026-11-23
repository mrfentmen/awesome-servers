# Brioche Butter Temp Planner

Real local JSON analysis of brioche butter temp in the Bake Lab lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/brioche-butter-temp-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "brioche-butter-temp-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/brioche-butter-temp-mcp"]
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
      "id": "bake_lab_brioche_butter_temp-rows-1",
      "name": "Rows primary",
      "category": "rows",
      "tags": [
        "bake-lab",
        "brioche",
        "butter"
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
      "id": "bake_lab_brioche_butter_temp-flags-2",
      "name": "Flags primary",
      "category": "flags",
      "tags": [
        "bake-lab",
        "brioche",
        "butter"
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
| `inventory_bake_lab_brioche_butter_temp` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_bake_lab_brioche_butter_temp_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_bake_lab_brioche_butter_temp_coverage` | Show category coverage ratios and unknown categories. |
| `flag_bake_lab_brioche_butter_temp_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_bake_lab_brioche_butter_temp_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_bake_lab_brioche_butter_temp_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_bake_lab_brioche_butter_temp_baseline` | Compare category counts with the configured baseline. |
| `estimate_bake_lab_brioche_butter_temp_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_bake_lab_brioche_butter_temp_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_bake_lab_brioche_butter_temp_dependencies` | Map dependency groups and show which ones are missing. |
| `test_bake_lab_brioche_butter_temp_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_bake_lab_brioche_butter_temp_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_bake_lab_brioche_butter_temp_fixes` | Rank fixes by impact divided by effort. |
| `validate_bake_lab_brioche_butter_temp_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_bake_lab_brioche_butter_temp_duplicates` | Group items with the same category and normalized name. |
| `measure_bake_lab_brioche_butter_temp_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_bake_lab_brioche_butter_temp_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_bake_lab_brioche_butter_temp_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_bake_lab_brioche_butter_temp_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_bake_lab_brioche_butter_temp_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_bake_lab_brioche_butter_temp_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_bake_lab_brioche_butter_temp_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_bake_lab_brioche_butter_temp_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_bake_lab_brioche_butter_temp_next_steps` | Recommend the next five actions with quick wins. |
| `open_bake_lab_brioche_butter_temp_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
