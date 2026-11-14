# Pet Store Stock Audit

Audit pet store stock for food, treats, medication and accessory expiry. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/petco-store-stock-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "petco-store-stock-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/petco-store-stock-check-mcp"]
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
      "id": "stock-dog-food",
      "name": "Dog food bag",
      "category": "food",
      "tags": [
        "dry"
      ],
      "cost": 50,
      "quantity": 1,
      "expires": "2027-08-01",
      "condition": "new"
    },
    {
      "id": "stock-cat-food",
      "name": "Cat food case",
      "category": "food",
      "tags": [
        "wet"
      ],
      "cost": 35,
      "quantity": 1,
      "expires": "2027-04-01",
      "condition": "new"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_store_stock` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_store_stock_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_store_stock_coverage` | Show category coverage ratios and unknown categories. |
| `flag_store_stock_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_store_stock_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_store_stock_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_store_stock_baseline` | Compare category counts with the configured baseline. |
| `estimate_store_stock_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_store_stock_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_store_stock_dependencies` | Map dependency groups and show which ones are missing. |
| `test_store_stock_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_store_stock_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_store_stock_fixes` | Rank fixes by impact divided by effort. |
| `validate_store_stock_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_store_stock_duplicates` | Group items with the same category and normalized name. |
| `measure_store_stock_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_store_stock_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_store_stock_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_store_stock_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_store_stock_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_store_stock_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_store_stock_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_store_stock_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_store_stock_next_steps` | Recommend the next five actions with quick wins. |
| `open_store_stock_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
