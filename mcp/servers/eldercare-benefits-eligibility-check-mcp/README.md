# Benefits Eligibility Audit

Audit benefits eligibility by income, assets, health, housing coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/eldercare-benefits-eligibility-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "eldercare-benefits-eligibility-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/eldercare-benefits-eligibility-check-mcp"]
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
      "id": "eldercare_benefits_eligibility-income-1",
      "name": "Income primary",
      "category": "income",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 20,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_benefits_eligibility-assets-2",
      "name": "Assets primary",
      "category": "assets",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 35,
      "quantity": 7,
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
| `inventory_eldercare_benefits_eligibility` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_eldercare_benefits_eligibility_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_eldercare_benefits_eligibility_coverage` | Show category coverage ratios and unknown categories. |
| `flag_eldercare_benefits_eligibility_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_eldercare_benefits_eligibility_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_eldercare_benefits_eligibility_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_eldercare_benefits_eligibility_baseline` | Compare category counts with the configured baseline. |
| `estimate_eldercare_benefits_eligibility_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_eldercare_benefits_eligibility_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_eldercare_benefits_eligibility_dependencies` | Map dependency groups and show which ones are missing. |
| `test_eldercare_benefits_eligibility_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_eldercare_benefits_eligibility_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_eldercare_benefits_eligibility_fixes` | Rank fixes by impact divided by effort. |
| `validate_eldercare_benefits_eligibility_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_eldercare_benefits_eligibility_duplicates` | Group items with the same category and normalized name. |
| `measure_eldercare_benefits_eligibility_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_eldercare_benefits_eligibility_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_eldercare_benefits_eligibility_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_eldercare_benefits_eligibility_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_eldercare_benefits_eligibility_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_eldercare_benefits_eligibility_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_eldercare_benefits_eligibility_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_eldercare_benefits_eligibility_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_eldercare_benefits_eligibility_next_steps` | Recommend the next five actions with quick wins. |
| `open_eldercare_benefits_eligibility_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
