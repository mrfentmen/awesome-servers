# Board Corrosion Planning Audit

Plan board corrosion by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/electronics-board-corrosion-plan-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "electronics-board-corrosion-plan-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/electronics-board-corrosion-plan-mcp"]
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
      "id": "board_corrosion_plan-battery",
      "name": "Battery contacts",
      "category": "power",
      "tags": [
        "alkaline",
        "residue"
      ],
      "cost": 0,
      "quantity": 28,
      "condition": "fair"
    },
    {
      "id": "board_corrosion_plan-usb",
      "name": "USB port",
      "category": "connector",
      "tags": [
        "salt-mist",
        "pins"
      ],
      "cost": 0,
      "quantity": 35,
      "condition": "fair"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_board_corrosion_plan` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_board_corrosion_plan_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_board_corrosion_plan_coverage` | Show category coverage ratios and unknown categories. |
| `flag_board_corrosion_plan_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_board_corrosion_plan_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_board_corrosion_plan_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_board_corrosion_plan_baseline` | Compare category counts with the configured baseline. |
| `estimate_board_corrosion_plan_corrosion_score` | Calculate the primary metric for every item with mean and pass count. |
| `find_board_corrosion_plan_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_board_corrosion_plan_dependencies` | Map dependency groups and show which ones are missing. |
| `test_board_corrosion_plan_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_board_corrosion_plan_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_board_corrosion_plan_fixes` | Rank fixes by impact divided by effort. |
| `validate_board_corrosion_plan_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_board_corrosion_plan_duplicates` | Group items with the same category and normalized name. |
| `measure_board_corrosion_plan_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_board_corrosion_plan_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_board_corrosion_plan_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_board_corrosion_plan_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_board_corrosion_plan_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_board_corrosion_plan_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_board_corrosion_plan_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_board_corrosion_plan_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_board_corrosion_plan_next_steps` | Recommend the next five actions with quick wins. |
| `open_board_corrosion_plan_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
