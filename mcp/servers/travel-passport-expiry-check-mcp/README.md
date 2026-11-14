# Passport Expiry Audit

Audit passports, visas, insurance and vaccination documents for expiry and travel readiness. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/travel-passport-expiry-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "travel-passport-expiry-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/travel-passport-expiry-check-mcp"]
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
      "id": "travel-passport",
      "name": "Passport",
      "category": "passport",
      "tags": [
        "identity"
      ],
      "cost": 160,
      "quantity": 1,
      "acquired": "2023-05-01",
      "expires": "2028-05-01",
      "condition": "good"
    },
    {
      "id": "travel-visa",
      "name": "Tourist visa",
      "category": "visa",
      "tags": [
        "entry"
      ],
      "cost": 80,
      "quantity": 1,
      "acquired": "2026-01-01",
      "expires": "2027-02-01",
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_passport_expiry` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_passport_expiry_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_passport_expiry_coverage` | Show category coverage ratios and unknown categories. |
| `flag_passport_expiry_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_passport_expiry_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_passport_expiry_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_passport_expiry_baseline` | Compare category counts with the configured baseline. |
| `estimate_passport_expiry_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_passport_expiry_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_passport_expiry_dependencies` | Map dependency groups and show which ones are missing. |
| `test_passport_expiry_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_passport_expiry_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_passport_expiry_fixes` | Rank fixes by impact divided by effort. |
| `validate_passport_expiry_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_passport_expiry_duplicates` | Group items with the same category and normalized name. |
| `measure_passport_expiry_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_passport_expiry_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_passport_expiry_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_passport_expiry_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_passport_expiry_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_passport_expiry_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_passport_expiry_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_passport_expiry_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_passport_expiry_next_steps` | Recommend the next five actions with quick wins. |
| `open_passport_expiry_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
