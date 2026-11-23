# Terminix Pest Plan Tracker

Real local JSON analysis of terminix pest plan in the Terminix Pest lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/terminix-pest-plan-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "terminix-pest-plan-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/terminix-pest-plan-mcp"]
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
      "id": "terminix_pest_terminix_pest_plan-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "terminix-pest",
        "terminix",
        "pest"
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
      "id": "terminix_pest_terminix_pest_plan-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "terminix-pest",
        "terminix",
        "pest"
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
| `inventory_terminix_pest_terminix_pest_plan` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_terminix_pest_terminix_pest_plan_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_terminix_pest_terminix_pest_plan_coverage` | Show category coverage ratios and unknown categories. |
| `flag_terminix_pest_terminix_pest_plan_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_terminix_pest_terminix_pest_plan_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_terminix_pest_terminix_pest_plan_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_terminix_pest_terminix_pest_plan_baseline` | Compare category counts with the configured baseline. |
| `estimate_terminix_pest_terminix_pest_plan_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_terminix_pest_terminix_pest_plan_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_terminix_pest_terminix_pest_plan_dependencies` | Map dependency groups and show which ones are missing. |
| `test_terminix_pest_terminix_pest_plan_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_terminix_pest_terminix_pest_plan_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_terminix_pest_terminix_pest_plan_fixes` | Rank fixes by impact divided by effort. |
| `validate_terminix_pest_terminix_pest_plan_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_terminix_pest_terminix_pest_plan_duplicates` | Group items with the same category and normalized name. |
| `measure_terminix_pest_terminix_pest_plan_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_terminix_pest_terminix_pest_plan_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_terminix_pest_terminix_pest_plan_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_terminix_pest_terminix_pest_plan_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_terminix_pest_terminix_pest_plan_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_terminix_pest_terminix_pest_plan_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_terminix_pest_terminix_pest_plan_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_terminix_pest_terminix_pest_plan_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_terminix_pest_terminix_pest_plan_next_steps` | Recommend the next five actions with quick wins. |
| `open_terminix_pest_terminix_pest_plan_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
