# Crockpot Slow Cook Tracker

Real local JSON analysis of crockpot slow cook in the Crockpot Slow lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/crockpot-slow-cook-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "crockpot-slow-cook-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/crockpot-slow-cook-mcp"]
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
      "id": "crockpot_slow_crockpot_slow_cook-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "crockpot-slow",
        "crockpot",
        "slow"
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
      "id": "crockpot_slow_crockpot_slow_cook-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "crockpot-slow",
        "crockpot",
        "slow"
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
| `inventory_crockpot_slow_crockpot_slow_cook` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_crockpot_slow_crockpot_slow_cook_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_crockpot_slow_crockpot_slow_cook_coverage` | Show category coverage ratios and unknown categories. |
| `flag_crockpot_slow_crockpot_slow_cook_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_crockpot_slow_crockpot_slow_cook_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_crockpot_slow_crockpot_slow_cook_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_crockpot_slow_crockpot_slow_cook_baseline` | Compare category counts with the configured baseline. |
| `estimate_crockpot_slow_crockpot_slow_cook_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_crockpot_slow_crockpot_slow_cook_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_crockpot_slow_crockpot_slow_cook_dependencies` | Map dependency groups and show which ones are missing. |
| `test_crockpot_slow_crockpot_slow_cook_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_crockpot_slow_crockpot_slow_cook_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_crockpot_slow_crockpot_slow_cook_fixes` | Rank fixes by impact divided by effort. |
| `validate_crockpot_slow_crockpot_slow_cook_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_crockpot_slow_crockpot_slow_cook_duplicates` | Group items with the same category and normalized name. |
| `measure_crockpot_slow_crockpot_slow_cook_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_crockpot_slow_crockpot_slow_cook_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_crockpot_slow_crockpot_slow_cook_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_crockpot_slow_crockpot_slow_cook_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_crockpot_slow_crockpot_slow_cook_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_crockpot_slow_crockpot_slow_cook_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_crockpot_slow_crockpot_slow_cook_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_crockpot_slow_crockpot_slow_cook_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_crockpot_slow_crockpot_slow_cook_next_steps` | Recommend the next five actions with quick wins. |
| `open_crockpot_slow_crockpot_slow_cook_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
