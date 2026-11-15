# Pollinator Corridor Audit

Audit flower patches, bloom windows, nesting sites and pesticide gaps along a pollinator corridor. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/animals-pollinator-corridor-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "animals-pollinator-corridor-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/animals-pollinator-corridor-check-mcp"]
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
      "id": "pollinator_corridor-front-patch",
      "name": "Front patch",
      "category": "patches",
      "tags": [
        "patches"
      ],
      "cost": 60,
      "quantity": 16,
      "condition": "good"
    },
    {
      "id": "pollinator_corridor-side-strip",
      "name": "Side strip",
      "category": "bloom",
      "tags": [
        "bloom"
      ],
      "cost": 40,
      "quantity": 10,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_pollinator_corridor` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_pollinator_corridor_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_pollinator_corridor_coverage` | Show category coverage ratios and unknown categories. |
| `flag_pollinator_corridor_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_pollinator_corridor_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_pollinator_corridor_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_pollinator_corridor_baseline` | Compare category counts with the configured baseline. |
| `estimate_pollinator_corridor_bloom_weeks` | Calculate the primary metric for every item with mean and pass count. |
| `find_pollinator_corridor_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_pollinator_corridor_dependencies` | Map dependency groups and show which ones are missing. |
| `test_pollinator_corridor_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_pollinator_corridor_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_pollinator_corridor_fixes` | Rank fixes by impact divided by effort. |
| `validate_pollinator_corridor_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_pollinator_corridor_duplicates` | Group items with the same category and normalized name. |
| `measure_pollinator_corridor_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_pollinator_corridor_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_pollinator_corridor_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_pollinator_corridor_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_pollinator_corridor_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_pollinator_corridor_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_pollinator_corridor_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_pollinator_corridor_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_pollinator_corridor_next_steps` | Recommend the next five actions with quick wins. |
| `open_pollinator_corridor_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
