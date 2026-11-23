# Freezer Inventory Guide Archive

Real local JSON analysis of freezer inventory guide in the Freezer Inventory lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/freezer-inventory-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "freezer-inventory-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/freezer-inventory-guide-mcp"]
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
      "id": "freezer_inventory_freezer_inventory_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "freezer-inventory",
        "freezer",
        "inventory"
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
      "id": "freezer_inventory_freezer_inventory_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "freezer-inventory",
        "freezer",
        "inventory"
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
| `inventory_freezer_inventory_freezer_inventory_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_freezer_inventory_freezer_inventory_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_freezer_inventory_freezer_inventory_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_freezer_inventory_freezer_inventory_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_freezer_inventory_freezer_inventory_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_freezer_inventory_freezer_inventory_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_freezer_inventory_freezer_inventory_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_freezer_inventory_freezer_inventory_guide_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_freezer_inventory_freezer_inventory_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_freezer_inventory_freezer_inventory_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_freezer_inventory_freezer_inventory_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_freezer_inventory_freezer_inventory_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_freezer_inventory_freezer_inventory_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_freezer_inventory_freezer_inventory_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_freezer_inventory_freezer_inventory_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_freezer_inventory_freezer_inventory_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_freezer_inventory_freezer_inventory_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_freezer_inventory_freezer_inventory_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_freezer_inventory_freezer_inventory_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_freezer_inventory_freezer_inventory_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_freezer_inventory_freezer_inventory_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_freezer_inventory_freezer_inventory_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_freezer_inventory_freezer_inventory_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_freezer_inventory_freezer_inventory_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_freezer_inventory_freezer_inventory_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
