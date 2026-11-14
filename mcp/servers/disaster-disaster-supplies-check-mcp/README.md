# Disaster Supplies Audit

Audit emergency supplies for expiry, water, food, medical, power and tool coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/disaster-disaster-supplies-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "disaster-disaster-supplies-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/disaster-disaster-supplies-check-mcp"]
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
      "id": "supply-water",
      "name": "Case of water",
      "category": "water",
      "tags": [
        "sealed"
      ],
      "cost": 8,
      "quantity": 1,
      "acquired": "2026-06-01",
      "expires": "2027-06-01",
      "condition": "new"
    },
    {
      "id": "supply-food",
      "name": "Canned soup",
      "category": "food",
      "tags": [
        "canned"
      ],
      "cost": 3,
      "quantity": 6,
      "acquired": "2026-05-01",
      "expires": "2028-05-01",
      "condition": "new"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_disaster_supplies` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_disaster_supplies_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_disaster_supplies_coverage` | Show category coverage ratios and unknown categories. |
| `flag_disaster_supplies_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_disaster_supplies_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_disaster_supplies_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_disaster_supplies_baseline` | Compare category counts with the configured baseline. |
| `estimate_disaster_supplies_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_disaster_supplies_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_disaster_supplies_dependencies` | Map dependency groups and show which ones are missing. |
| `test_disaster_supplies_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_disaster_supplies_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_disaster_supplies_fixes` | Rank fixes by impact divided by effort. |
| `validate_disaster_supplies_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_disaster_supplies_duplicates` | Group items with the same category and normalized name. |
| `measure_disaster_supplies_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_disaster_supplies_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_disaster_supplies_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_disaster_supplies_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_disaster_supplies_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_disaster_supplies_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_disaster_supplies_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_disaster_supplies_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_disaster_supplies_next_steps` | Recommend the next five actions with quick wins. |
| `open_disaster_supplies_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
