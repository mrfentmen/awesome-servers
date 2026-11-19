# Goggle Fit Find Matcher

Real local JSON analysis of goggle fit find in the Swimming lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/swimming-goggle-fit-find-match-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "swimming-goggle-fit-find-match-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/swimming-goggle-fit-find-match-mcp"]
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
      "id": "swimming_swimming_goggle_fit_find_match-criteria-1",
      "name": "Criteria primary",
      "category": "criteria",
      "tags": [
        "swimming",
        "swimming",
        "goggle"
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
      "id": "swimming_swimming_goggle_fit_find_match-candidates-2",
      "name": "Candidates primary",
      "category": "candidates",
      "tags": [
        "swimming",
        "swimming",
        "goggle"
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
| `inventory_swimming_swimming_goggle_fit_find_match` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_swimming_swimming_goggle_fit_find_match_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_swimming_swimming_goggle_fit_find_match_coverage` | Show category coverage ratios and unknown categories. |
| `flag_swimming_swimming_goggle_fit_find_match_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_swimming_swimming_goggle_fit_find_match_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_swimming_swimming_goggle_fit_find_match_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_swimming_swimming_goggle_fit_find_match_baseline` | Compare category counts with the configured baseline. |
| `estimate_swimming_swimming_goggle_fit_find_match_clearance_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_swimming_swimming_goggle_fit_find_match_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_swimming_swimming_goggle_fit_find_match_dependencies` | Map dependency groups and show which ones are missing. |
| `test_swimming_swimming_goggle_fit_find_match_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_swimming_swimming_goggle_fit_find_match_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_swimming_swimming_goggle_fit_find_match_fixes` | Rank fixes by impact divided by effort. |
| `validate_swimming_swimming_goggle_fit_find_match_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_swimming_swimming_goggle_fit_find_match_duplicates` | Group items with the same category and normalized name. |
| `measure_swimming_swimming_goggle_fit_find_match_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_swimming_swimming_goggle_fit_find_match_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_swimming_swimming_goggle_fit_find_match_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_swimming_swimming_goggle_fit_find_match_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_swimming_swimming_goggle_fit_find_match_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_swimming_swimming_goggle_fit_find_match_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_swimming_swimming_goggle_fit_find_match_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_swimming_swimming_goggle_fit_find_match_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_swimming_swimming_goggle_fit_find_match_next_steps` | Recommend the next five actions with quick wins. |
| `open_swimming_swimming_goggle_fit_find_match_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
