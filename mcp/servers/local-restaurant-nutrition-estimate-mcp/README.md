# Local Restaurant Nutrition Estimate Audit

Local Restaurant Nutrition Estimate Audit: estimate indie menu nutrition, marked estimate. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/local-restaurant-nutrition-estimate-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "local-restaurant-nutrition-estimate-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/local-restaurant-nutrition-estimate-mcp"]
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
      "id": "local_menu-sample-1",
      "name": "Sample starters entry",
      "category": "starter",
      "tags": [
        "restaurant"
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
      "id": "local_menu-sample-2",
      "name": "Sample mains entry",
      "category": "main",
      "tags": [
        "restaurant"
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
| `inventory_local_menu` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_local_menu_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_local_menu_coverage` | Show category coverage ratios and unknown categories. |
| `flag_local_menu_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_local_menu_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_local_menu_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_local_menu_baseline` | Compare category counts with the configured baseline. |
| `estimate_local_menu_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_local_menu_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_local_menu_dependencies` | Map dependency groups and show which ones are missing. |
| `test_local_menu_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_local_menu_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_local_menu_fixes` | Rank fixes by impact divided by effort. |
| `validate_local_menu_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_local_menu_duplicates` | Group items with the same category and normalized name. |
| `measure_local_menu_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_local_menu_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_local_menu_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_local_menu_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_local_menu_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_local_menu_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_local_menu_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_local_menu_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_local_menu_next_steps` | Recommend the next five actions with quick wins. |
| `open_local_menu_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
