# Card Signup Visit Audit

Real local JSON analysis of card signup visit in the Libraries lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/libraries-card-signup-visit-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "libraries-card-signup-visit-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/libraries-card-signup-visit-check-mcp"]
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
      "id": "libraries_libraries_card_signup_visit_check-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "libraries",
        "libraries",
        "card"
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
      "id": "libraries_libraries_card_signup_visit_check-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "libraries",
        "libraries",
        "card"
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
| `inventory_libraries_libraries_card_signup_visit_check` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_libraries_libraries_card_signup_visit_check_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_libraries_libraries_card_signup_visit_check_coverage` | Show category coverage ratios and unknown categories. |
| `flag_libraries_libraries_card_signup_visit_check_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_libraries_libraries_card_signup_visit_check_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_libraries_libraries_card_signup_visit_check_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_libraries_libraries_card_signup_visit_check_baseline` | Compare category counts with the configured baseline. |
| `estimate_libraries_libraries_card_signup_visit_check_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_libraries_libraries_card_signup_visit_check_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_libraries_libraries_card_signup_visit_check_dependencies` | Map dependency groups and show which ones are missing. |
| `test_libraries_libraries_card_signup_visit_check_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_libraries_libraries_card_signup_visit_check_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_libraries_libraries_card_signup_visit_check_fixes` | Rank fixes by impact divided by effort. |
| `validate_libraries_libraries_card_signup_visit_check_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_libraries_libraries_card_signup_visit_check_duplicates` | Group items with the same category and normalized name. |
| `measure_libraries_libraries_card_signup_visit_check_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_libraries_libraries_card_signup_visit_check_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_libraries_libraries_card_signup_visit_check_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_libraries_libraries_card_signup_visit_check_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_libraries_libraries_card_signup_visit_check_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_libraries_libraries_card_signup_visit_check_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_libraries_libraries_card_signup_visit_check_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_libraries_libraries_card_signup_visit_check_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_libraries_libraries_card_signup_visit_check_next_steps` | Recommend the next five actions with quick wins. |
| `open_libraries_libraries_card_signup_visit_check_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
