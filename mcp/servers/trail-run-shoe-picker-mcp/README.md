# Trail Run Shoe Picker Audit

Real local JSON analysis of trail run shoe picker in the Strength Plan lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/trail-run-shoe-picker-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "trail-run-shoe-picker-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/trail-run-shoe-picker-mcp"]
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
      "id": "strength_plan_trail_run_shoe_picker-models-1",
      "name": "Models primary",
      "category": "models",
      "tags": [
        "strength-plan",
        "trail",
        "run"
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
      "id": "strength_plan_trail_run_shoe_picker-prices-2",
      "name": "Prices primary",
      "category": "prices",
      "tags": [
        "strength-plan",
        "trail",
        "run"
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
| `inventory_strength_plan_trail_run_shoe_picker` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_strength_plan_trail_run_shoe_picker_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_strength_plan_trail_run_shoe_picker_coverage` | Show category coverage ratios and unknown categories. |
| `flag_strength_plan_trail_run_shoe_picker_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_strength_plan_trail_run_shoe_picker_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_strength_plan_trail_run_shoe_picker_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_strength_plan_trail_run_shoe_picker_baseline` | Compare category counts with the configured baseline. |
| `estimate_strength_plan_trail_run_shoe_picker_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_strength_plan_trail_run_shoe_picker_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_strength_plan_trail_run_shoe_picker_dependencies` | Map dependency groups and show which ones are missing. |
| `test_strength_plan_trail_run_shoe_picker_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_strength_plan_trail_run_shoe_picker_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_strength_plan_trail_run_shoe_picker_fixes` | Rank fixes by impact divided by effort. |
| `validate_strength_plan_trail_run_shoe_picker_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_strength_plan_trail_run_shoe_picker_duplicates` | Group items with the same category and normalized name. |
| `measure_strength_plan_trail_run_shoe_picker_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_strength_plan_trail_run_shoe_picker_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_strength_plan_trail_run_shoe_picker_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_strength_plan_trail_run_shoe_picker_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_strength_plan_trail_run_shoe_picker_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_strength_plan_trail_run_shoe_picker_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_strength_plan_trail_run_shoe_picker_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_strength_plan_trail_run_shoe_picker_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_strength_plan_trail_run_shoe_picker_next_steps` | Recommend the next five actions with quick wins. |
| `open_strength_plan_trail_run_shoe_picker_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
