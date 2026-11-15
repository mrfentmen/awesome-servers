# Coastal Erosion Audit

Audit bluff condition, drainage, vegetation and coastal access. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/california-coastal-erosion-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "california-coastal-erosion-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/california-coastal-erosion-check-mcp"]
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
      "id": "coastal_erosion-bluff-edge",
      "name": "Bluff edge",
      "category": "bluff",
      "tags": [
        "bluff"
      ],
      "cost": 0,
      "quantity": 3,
      "condition": "worn"
    },
    {
      "id": "coastal_erosion-drainage-outlet",
      "name": "Drainage outlet",
      "category": "drainage",
      "tags": [
        "drainage"
      ],
      "cost": 300,
      "quantity": 1,
      "condition": "fair"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_coastal_erosion` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_coastal_erosion_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_coastal_erosion_coverage` | Show category coverage ratios and unknown categories. |
| `flag_coastal_erosion_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_coastal_erosion_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_coastal_erosion_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_coastal_erosion_baseline` | Compare category counts with the configured baseline. |
| `estimate_coastal_erosion_erosion_ft` | Calculate the primary metric for every item with mean and pass count. |
| `find_coastal_erosion_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_coastal_erosion_dependencies` | Map dependency groups and show which ones are missing. |
| `test_coastal_erosion_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_coastal_erosion_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_coastal_erosion_fixes` | Rank fixes by impact divided by effort. |
| `validate_coastal_erosion_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_coastal_erosion_duplicates` | Group items with the same category and normalized name. |
| `measure_coastal_erosion_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_coastal_erosion_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_coastal_erosion_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_coastal_erosion_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_coastal_erosion_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_coastal_erosion_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_coastal_erosion_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_coastal_erosion_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_coastal_erosion_next_steps` | Recommend the next five actions with quick wins. |
| `open_coastal_erosion_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
