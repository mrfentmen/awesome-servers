# Move Box Inventory Audit

Move Box Inventory Audit: box by box move inventory. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/move-box-inventory-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "move-box-inventory-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/move-box-inventory-mcp"]
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
      "id": "move_box-sample-1",
      "name": "Sample kitchen entry",
      "category": "kitchen",
      "tags": [
        "moving"
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
      "id": "move_box-sample-2",
      "name": "Sample bedroom entry",
      "category": "bedroom",
      "tags": [
        "moving"
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
| `inventory_move_box` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_move_box_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_move_box_coverage` | Show category coverage ratios and unknown categories. |
| `flag_move_box_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_move_box_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_move_box_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_move_box_baseline` | Compare category counts with the configured baseline. |
| `estimate_move_box_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_move_box_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_move_box_dependencies` | Map dependency groups and show which ones are missing. |
| `test_move_box_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_move_box_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_move_box_fixes` | Rank fixes by impact divided by effort. |
| `validate_move_box_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_move_box_duplicates` | Group items with the same category and normalized name. |
| `measure_move_box_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_move_box_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_move_box_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_move_box_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_move_box_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_move_box_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_move_box_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_move_box_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_move_box_next_steps` | Recommend the next five actions with quick wins. |
| `open_move_box_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
