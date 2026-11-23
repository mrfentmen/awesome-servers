# Supreme Court Docket Matcher

Real local JSON analysis of supreme court docket in the Supreme Court lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/supreme-court-docket-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "supreme-court-docket-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/supreme-court-docket-mcp"]
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
      "id": "supreme_court_supreme_court_docket-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "supreme-court",
        "supreme",
        "court"
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
      "id": "supreme_court_supreme_court_docket-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "supreme-court",
        "supreme",
        "court"
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
| `inventory_supreme_court_supreme_court_docket` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_supreme_court_supreme_court_docket_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_supreme_court_supreme_court_docket_coverage` | Show category coverage ratios and unknown categories. |
| `flag_supreme_court_supreme_court_docket_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_supreme_court_supreme_court_docket_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_supreme_court_supreme_court_docket_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_supreme_court_supreme_court_docket_baseline` | Compare category counts with the configured baseline. |
| `estimate_supreme_court_supreme_court_docket_clearance_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_supreme_court_supreme_court_docket_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_supreme_court_supreme_court_docket_dependencies` | Map dependency groups and show which ones are missing. |
| `test_supreme_court_supreme_court_docket_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_supreme_court_supreme_court_docket_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_supreme_court_supreme_court_docket_fixes` | Rank fixes by impact divided by effort. |
| `validate_supreme_court_supreme_court_docket_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_supreme_court_supreme_court_docket_duplicates` | Group items with the same category and normalized name. |
| `measure_supreme_court_supreme_court_docket_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_supreme_court_supreme_court_docket_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_supreme_court_supreme_court_docket_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_supreme_court_supreme_court_docket_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_supreme_court_supreme_court_docket_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_supreme_court_supreme_court_docket_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_supreme_court_supreme_court_docket_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_supreme_court_supreme_court_docket_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_supreme_court_supreme_court_docket_next_steps` | Recommend the next five actions with quick wins. |
| `open_supreme_court_supreme_court_docket_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
