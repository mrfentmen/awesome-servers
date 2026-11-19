# Community Fridge Stock Board Audit

Community Fridge Stock Board Audit: volunteer-entered fridge stock board. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/community-fridge-stock-board-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "community-fridge-stock-board-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/community-fridge-stock-board-mcp"]
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
      "id": "fridge_stock-sample-1",
      "name": "Sample fresh entry",
      "category": "fresh",
      "tags": [
        "community"
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
      "id": "fridge_stock-sample-2",
      "name": "Sample canned entry",
      "category": "canned",
      "tags": [
        "community"
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
| `inventory_fridge_stock` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_fridge_stock_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_fridge_stock_coverage` | Show category coverage ratios and unknown categories. |
| `flag_fridge_stock_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_fridge_stock_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_fridge_stock_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_fridge_stock_baseline` | Compare category counts with the configured baseline. |
| `estimate_fridge_stock_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_fridge_stock_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_fridge_stock_dependencies` | Map dependency groups and show which ones are missing. |
| `test_fridge_stock_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_fridge_stock_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_fridge_stock_fixes` | Rank fixes by impact divided by effort. |
| `validate_fridge_stock_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_fridge_stock_duplicates` | Group items with the same category and normalized name. |
| `measure_fridge_stock_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_fridge_stock_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_fridge_stock_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_fridge_stock_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_fridge_stock_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_fridge_stock_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_fridge_stock_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_fridge_stock_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_fridge_stock_next_steps` | Recommend the next five actions with quick wins. |
| `open_fridge_stock_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
