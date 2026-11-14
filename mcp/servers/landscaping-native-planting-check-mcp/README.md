# Native Planting Audit

Audit native shrubs, perennials, grasses and trees for native share, coverage and planting gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/landscaping-native-planting-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "landscaping-native-planting-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/landscaping-native-planting-check-mcp"]
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
      "id": "native-shrub",
      "name": "Native shrub",
      "category": "shrub",
      "tags": [
        "evergreen"
      ],
      "cost": 25,
      "quantity": 70,
      "acquired": "2026-03-01",
      "expires": "2027-03-01",
      "condition": "good"
    },
    {
      "id": "native-perennial",
      "name": "Native perennial",
      "category": "perennial",
      "tags": [
        "pollinator"
      ],
      "cost": 12,
      "quantity": 55,
      "acquired": "2026-04-01",
      "expires": "2027-04-01",
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_native_planting` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_native_planting_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_native_planting_coverage` | Show category coverage ratios and unknown categories. |
| `flag_native_planting_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_native_planting_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_native_planting_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_native_planting_baseline` | Compare category counts with the configured baseline. |
| `estimate_native_planting_germination_rate` | Calculate the primary metric for every item with mean and pass count. |
| `find_native_planting_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_native_planting_dependencies` | Map dependency groups and show which ones are missing. |
| `test_native_planting_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_native_planting_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_native_planting_fixes` | Rank fixes by impact divided by effort. |
| `validate_native_planting_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_native_planting_duplicates` | Group items with the same category and normalized name. |
| `measure_native_planting_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_native_planting_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_native_planting_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_native_planting_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_native_planting_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_native_planting_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_native_planting_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_native_planting_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_native_planting_next_steps` | Recommend the next five actions with quick wins. |
| `open_native_planting_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
