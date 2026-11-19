# Indie Cafe Drink Estimate Audit

Indie Cafe Drink Estimate Audit: estimate indie cafe drink builds and cost. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/independent-cafe-drink-estimate-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "independent-cafe-drink-estimate-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/independent-cafe-drink-estimate-mcp"]
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
      "id": "cafe_drink-sample-1",
      "name": "Sample espresso entry",
      "category": "espresso",
      "tags": [
        "cafe"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "cafe_drink-sample-2",
      "name": "Sample brewed entry",
      "category": "brew",
      "tags": [
        "cafe"
      ],
      "cost": 30,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_cafe_drink` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_cafe_drink_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_cafe_drink_coverage` | Show category coverage ratios and unknown categories. |
| `flag_cafe_drink_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_cafe_drink_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_cafe_drink_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_cafe_drink_baseline` | Compare category counts with the configured baseline. |
| `estimate_cafe_drink_cost_per_use` | Calculate the primary metric for every item with mean and pass count. |
| `find_cafe_drink_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_cafe_drink_dependencies` | Map dependency groups and show which ones are missing. |
| `test_cafe_drink_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_cafe_drink_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_cafe_drink_fixes` | Rank fixes by impact divided by effort. |
| `validate_cafe_drink_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_cafe_drink_duplicates` | Group items with the same category and normalized name. |
| `measure_cafe_drink_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_cafe_drink_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_cafe_drink_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_cafe_drink_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_cafe_drink_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_cafe_drink_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_cafe_drink_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_cafe_drink_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_cafe_drink_next_steps` | Recommend the next five actions with quick wins. |
| `open_cafe_drink_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
