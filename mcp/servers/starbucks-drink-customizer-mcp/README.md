# Starbucks Drink Customizer Tracker

Real local JSON analysis of starbucks drink customizer in the Starbucks Drink lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/starbucks-drink-customizer-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "starbucks-drink-customizer-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/starbucks-drink-customizer-mcp"]
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
      "id": "starbucks_drink_starbucks_drink_customizer-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "starbucks-drink",
        "starbucks",
        "drink"
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
      "id": "starbucks_drink_starbucks_drink_customizer-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "starbucks-drink",
        "starbucks",
        "drink"
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
| `inventory_starbucks_drink_starbucks_drink_customizer` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_starbucks_drink_starbucks_drink_customizer_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_starbucks_drink_starbucks_drink_customizer_coverage` | Show category coverage ratios and unknown categories. |
| `flag_starbucks_drink_starbucks_drink_customizer_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_starbucks_drink_starbucks_drink_customizer_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_starbucks_drink_starbucks_drink_customizer_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_starbucks_drink_starbucks_drink_customizer_baseline` | Compare category counts with the configured baseline. |
| `estimate_starbucks_drink_starbucks_drink_customizer_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_starbucks_drink_starbucks_drink_customizer_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_starbucks_drink_starbucks_drink_customizer_dependencies` | Map dependency groups and show which ones are missing. |
| `test_starbucks_drink_starbucks_drink_customizer_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_starbucks_drink_starbucks_drink_customizer_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_starbucks_drink_starbucks_drink_customizer_fixes` | Rank fixes by impact divided by effort. |
| `validate_starbucks_drink_starbucks_drink_customizer_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_starbucks_drink_starbucks_drink_customizer_duplicates` | Group items with the same category and normalized name. |
| `measure_starbucks_drink_starbucks_drink_customizer_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_starbucks_drink_starbucks_drink_customizer_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_starbucks_drink_starbucks_drink_customizer_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_starbucks_drink_starbucks_drink_customizer_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_starbucks_drink_starbucks_drink_customizer_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_starbucks_drink_starbucks_drink_customizer_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_starbucks_drink_starbucks_drink_customizer_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_starbucks_drink_starbucks_drink_customizer_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_starbucks_drink_starbucks_drink_customizer_next_steps` | Recommend the next five actions with quick wins. |
| `open_starbucks_drink_starbucks_drink_customizer_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
