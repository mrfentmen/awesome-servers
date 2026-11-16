# Cat Adoption Audit

Audit cat adoption by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/cats-cat-adoption-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "cats-cat-adoption-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/cats-cat-adoption-check-mcp"]
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
      "id": "cat_adoption-home",
      "name": "Landlord approval",
      "category": "housing",
      "tags": [
        "rental",
        "written"
      ],
      "cost": 0,
      "quantity": 100,
      "condition": "good"
    },
    {
      "id": "cat_adoption-litter",
      "name": "Litter routine",
      "category": "schedule",
      "tags": [
        "daily",
        "two-boxes"
      ],
      "cost": 0,
      "quantity": 90,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_cat_adoption` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_cat_adoption_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_cat_adoption_coverage` | Show category coverage ratios and unknown categories. |
| `flag_cat_adoption_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_cat_adoption_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_cat_adoption_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_cat_adoption_baseline` | Compare category counts with the configured baseline. |
| `estimate_cat_adoption_readiness_score` | Calculate the primary metric for every item with mean and pass count. |
| `find_cat_adoption_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_cat_adoption_dependencies` | Map dependency groups and show which ones are missing. |
| `test_cat_adoption_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_cat_adoption_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_cat_adoption_fixes` | Rank fixes by impact divided by effort. |
| `validate_cat_adoption_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_cat_adoption_duplicates` | Group items with the same category and normalized name. |
| `measure_cat_adoption_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_cat_adoption_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_cat_adoption_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_cat_adoption_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_cat_adoption_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_cat_adoption_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_cat_adoption_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_cat_adoption_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_cat_adoption_next_steps` | Recommend the next five actions with quick wins. |
| `open_cat_adoption_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
