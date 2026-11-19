# Storage Unit Inventory Cost Audit

Storage Unit Inventory Cost Audit: unit inventory and monthly cost. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/storage-unit-inventory-cost-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "storage-unit-inventory-cost-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/storage-unit-inventory-cost-mcp"]
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
      "id": "storage_unit-sample-1",
      "name": "Sample furniture entry",
      "category": "furniture",
      "tags": [
        "storage"
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
      "id": "storage_unit-sample-2",
      "name": "Sample boxes entry",
      "category": "boxes",
      "tags": [
        "storage"
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
| `inventory_storage_unit` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_storage_unit_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_storage_unit_coverage` | Show category coverage ratios and unknown categories. |
| `flag_storage_unit_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_storage_unit_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_storage_unit_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_storage_unit_baseline` | Compare category counts with the configured baseline. |
| `estimate_storage_unit_cost_per_use` | Calculate the primary metric for every item with mean and pass count. |
| `find_storage_unit_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_storage_unit_dependencies` | Map dependency groups and show which ones are missing. |
| `test_storage_unit_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_storage_unit_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_storage_unit_fixes` | Rank fixes by impact divided by effort. |
| `validate_storage_unit_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_storage_unit_duplicates` | Group items with the same category and normalized name. |
| `measure_storage_unit_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_storage_unit_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_storage_unit_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_storage_unit_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_storage_unit_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_storage_unit_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_storage_unit_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_storage_unit_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_storage_unit_next_steps` | Recommend the next five actions with quick wins. |
| `open_storage_unit_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
