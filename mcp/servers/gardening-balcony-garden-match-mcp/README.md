# Balcony Garden Match Audit

Match balcony garden by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/gardening-balcony-garden-match-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "gardening-balcony-garden-match-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/gardening-balcony-garden-match-mcp"]
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
      "id": "balcony_garden_match-basil",
      "name": "Basil",
      "category": "herb",
      "tags": [
        "culinary",
        "sun"
      ],
      "cost": 8,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "balcony_garden_match-tomato",
      "name": "Cherry tomato",
      "category": "vegetable",
      "tags": [
        "fruiting",
        "sun"
      ],
      "cost": 12,
      "quantity": 7,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_balcony_garden_match` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_balcony_garden_match_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_balcony_garden_match_coverage` | Show category coverage ratios and unknown categories. |
| `flag_balcony_garden_match_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_balcony_garden_match_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_balcony_garden_match_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_balcony_garden_match_baseline` | Compare category counts with the configured baseline. |
| `estimate_balcony_garden_match_sun_hours` | Calculate the primary metric for every item with mean and pass count. |
| `find_balcony_garden_match_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_balcony_garden_match_dependencies` | Map dependency groups and show which ones are missing. |
| `test_balcony_garden_match_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_balcony_garden_match_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_balcony_garden_match_fixes` | Rank fixes by impact divided by effort. |
| `validate_balcony_garden_match_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_balcony_garden_match_duplicates` | Group items with the same category and normalized name. |
| `measure_balcony_garden_match_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_balcony_garden_match_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_balcony_garden_match_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_balcony_garden_match_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_balcony_garden_match_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_balcony_garden_match_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_balcony_garden_match_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_balcony_garden_match_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_balcony_garden_match_next_steps` | Recommend the next five actions with quick wins. |
| `open_balcony_garden_match_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
