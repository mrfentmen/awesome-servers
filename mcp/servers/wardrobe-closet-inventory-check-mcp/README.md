# Closet Inventory Audit

Audit a wardrobe by category, cost per wear, condition, expiry window and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/wardrobe-closet-inventory-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "wardrobe-closet-inventory-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/wardrobe-closet-inventory-check-mcp"]
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
      "id": "closet-tee",
      "name": "White tee",
      "category": "top",
      "tags": [
        "cotton",
        "basic"
      ],
      "cost": 20,
      "quantity": 24,
      "acquired": "2025-03-01",
      "lastUsed": "2026-11-01",
      "condition": "good"
    },
    {
      "id": "closet-jeans",
      "name": "Straight jeans",
      "category": "bottom",
      "tags": [
        "denim"
      ],
      "cost": 80,
      "quantity": 4,
      "acquired": "2024-09-01",
      "lastUsed": "2026-11-03",
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_closet_inventory` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_closet_inventory_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_closet_inventory_coverage` | Show category coverage ratios and unknown categories. |
| `flag_closet_inventory_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_closet_inventory_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_closet_inventory_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_closet_inventory_baseline` | Compare category counts with the configured baseline. |
| `estimate_closet_inventory_cost_per_use` | Calculate the primary metric for every item with mean and pass count. |
| `find_closet_inventory_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_closet_inventory_dependencies` | Map dependency groups and show which ones are missing. |
| `test_closet_inventory_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_closet_inventory_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_closet_inventory_fixes` | Rank fixes by impact divided by effort. |
| `validate_closet_inventory_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_closet_inventory_duplicates` | Group items with the same category and normalized name. |
| `measure_closet_inventory_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_closet_inventory_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_closet_inventory_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_closet_inventory_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_closet_inventory_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_closet_inventory_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_closet_inventory_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_closet_inventory_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_closet_inventory_next_steps` | Recommend the next five actions with quick wins. |
| `open_closet_inventory_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
