# Christmas Ham Glaze Tracker

Real local JSON analysis of christmas ham glaze in the Christmas Ham lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/christmas-ham-glaze-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "christmas-ham-glaze-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/christmas-ham-glaze-mcp"]
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
      "id": "christmas_ham_christmas_ham_glaze-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "christmas-ham",
        "christmas",
        "ham"
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
      "id": "christmas_ham_christmas_ham_glaze-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "christmas-ham",
        "christmas",
        "ham"
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
| `inventory_christmas_ham_christmas_ham_glaze` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_christmas_ham_christmas_ham_glaze_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_christmas_ham_christmas_ham_glaze_coverage` | Show category coverage ratios and unknown categories. |
| `flag_christmas_ham_christmas_ham_glaze_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_christmas_ham_christmas_ham_glaze_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_christmas_ham_christmas_ham_glaze_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_christmas_ham_christmas_ham_glaze_baseline` | Compare category counts with the configured baseline. |
| `estimate_christmas_ham_christmas_ham_glaze_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_christmas_ham_christmas_ham_glaze_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_christmas_ham_christmas_ham_glaze_dependencies` | Map dependency groups and show which ones are missing. |
| `test_christmas_ham_christmas_ham_glaze_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_christmas_ham_christmas_ham_glaze_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_christmas_ham_christmas_ham_glaze_fixes` | Rank fixes by impact divided by effort. |
| `validate_christmas_ham_christmas_ham_glaze_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_christmas_ham_christmas_ham_glaze_duplicates` | Group items with the same category and normalized name. |
| `measure_christmas_ham_christmas_ham_glaze_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_christmas_ham_christmas_ham_glaze_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_christmas_ham_christmas_ham_glaze_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_christmas_ham_christmas_ham_glaze_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_christmas_ham_christmas_ham_glaze_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_christmas_ham_christmas_ham_glaze_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_christmas_ham_christmas_ham_glaze_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_christmas_ham_christmas_ham_glaze_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_christmas_ham_christmas_ham_glaze_next_steps` | Recommend the next five actions with quick wins. |
| `open_christmas_ham_christmas_ham_glaze_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
