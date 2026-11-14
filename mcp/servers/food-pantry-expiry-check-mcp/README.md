# Pantry Expiry Audit

Audit pantry stock for expiry, category coverage, spend and missing meal dependencies. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/food-pantry-expiry-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "food-pantry-expiry-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/food-pantry-expiry-check-mcp"]
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
      "id": "pantry-rice",
      "name": "Jasmine rice",
      "category": "grain",
      "tags": [
        "staple"
      ],
      "cost": 12,
      "quantity": 1,
      "acquired": "2026-01-01",
      "expires": "2027-12-01",
      "condition": "new"
    },
    {
      "id": "pantry-beans",
      "name": "Black beans",
      "category": "can",
      "tags": [
        "protein"
      ],
      "cost": 2,
      "quantity": 4,
      "acquired": "2026-02-01",
      "expires": "2028-01-01",
      "condition": "new"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_pantry_expiry` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_pantry_expiry_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_pantry_expiry_coverage` | Show category coverage ratios and unknown categories. |
| `flag_pantry_expiry_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_pantry_expiry_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_pantry_expiry_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_pantry_expiry_baseline` | Compare category counts with the configured baseline. |
| `estimate_pantry_expiry_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_pantry_expiry_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_pantry_expiry_dependencies` | Map dependency groups and show which ones are missing. |
| `test_pantry_expiry_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_pantry_expiry_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_pantry_expiry_fixes` | Rank fixes by impact divided by effort. |
| `validate_pantry_expiry_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_pantry_expiry_duplicates` | Group items with the same category and normalized name. |
| `measure_pantry_expiry_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_pantry_expiry_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_pantry_expiry_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_pantry_expiry_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_pantry_expiry_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_pantry_expiry_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_pantry_expiry_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_pantry_expiry_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_pantry_expiry_next_steps` | Recommend the next five actions with quick wins. |
| `open_pantry_expiry_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
