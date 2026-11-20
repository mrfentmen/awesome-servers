# Debt Inventory Audit

Audit debt inventory by creditor, balance, rate, due date coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/debt-debt-inventory-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "debt-debt-inventory-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/debt-debt-inventory-check-mcp"]
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
      "id": "debt_debt_inventory-creditor-1",
      "name": "Creditor primary",
      "category": "creditor",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
      "id": "debt_debt_inventory-balance-2",
      "name": "Balance primary",
      "category": "balance",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
| `inventory_debt_debt_inventory` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_debt_debt_inventory_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_debt_debt_inventory_coverage` | Show category coverage ratios and unknown categories. |
| `flag_debt_debt_inventory_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_debt_debt_inventory_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_debt_debt_inventory_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_debt_debt_inventory_baseline` | Compare category counts with the configured baseline. |
| `estimate_debt_debt_inventory_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_debt_debt_inventory_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_debt_debt_inventory_dependencies` | Map dependency groups and show which ones are missing. |
| `test_debt_debt_inventory_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_debt_debt_inventory_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_debt_debt_inventory_fixes` | Rank fixes by impact divided by effort. |
| `validate_debt_debt_inventory_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_debt_debt_inventory_duplicates` | Group items with the same category and normalized name. |
| `measure_debt_debt_inventory_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_debt_debt_inventory_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_debt_debt_inventory_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_debt_debt_inventory_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_debt_debt_inventory_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_debt_debt_inventory_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_debt_debt_inventory_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_debt_debt_inventory_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_debt_debt_inventory_next_steps` | Recommend the next five actions with quick wins. |
| `open_debt_debt_inventory_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
