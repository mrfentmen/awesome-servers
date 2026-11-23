# Ikea Stock Checker Tracker

Real local JSON analysis of ikea stock checker in the Ikea Stock lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/ikea-stock-checker-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "ikea-stock-checker-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/ikea-stock-checker-mcp"]
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
      "id": "ikea_stock_ikea_stock_checker-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "ikea-stock",
        "ikea",
        "stock"
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
      "id": "ikea_stock_ikea_stock_checker-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "ikea-stock",
        "ikea",
        "stock"
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
| `inventory_ikea_stock_ikea_stock_checker` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_ikea_stock_ikea_stock_checker_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_ikea_stock_ikea_stock_checker_coverage` | Show category coverage ratios and unknown categories. |
| `flag_ikea_stock_ikea_stock_checker_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_ikea_stock_ikea_stock_checker_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_ikea_stock_ikea_stock_checker_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_ikea_stock_ikea_stock_checker_baseline` | Compare category counts with the configured baseline. |
| `estimate_ikea_stock_ikea_stock_checker_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_ikea_stock_ikea_stock_checker_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_ikea_stock_ikea_stock_checker_dependencies` | Map dependency groups and show which ones are missing. |
| `test_ikea_stock_ikea_stock_checker_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_ikea_stock_ikea_stock_checker_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_ikea_stock_ikea_stock_checker_fixes` | Rank fixes by impact divided by effort. |
| `validate_ikea_stock_ikea_stock_checker_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_ikea_stock_ikea_stock_checker_duplicates` | Group items with the same category and normalized name. |
| `measure_ikea_stock_ikea_stock_checker_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_ikea_stock_ikea_stock_checker_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_ikea_stock_ikea_stock_checker_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_ikea_stock_ikea_stock_checker_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_ikea_stock_ikea_stock_checker_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_ikea_stock_ikea_stock_checker_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_ikea_stock_ikea_stock_checker_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_ikea_stock_ikea_stock_checker_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_ikea_stock_ikea_stock_checker_next_steps` | Recommend the next five actions with quick wins. |
| `open_ikea_stock_ikea_stock_checker_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
