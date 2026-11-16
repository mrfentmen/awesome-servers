# Pest Watch Audit

Audit pest watch by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/gardening-pest-watch-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "gardening-pest-watch-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/gardening-pest-watch-check-mcp"]
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
      "id": "pest_watch-rose",
      "name": "Rose aphids",
      "category": "aphid",
      "tags": [
        "rose",
        "foliage"
      ],
      "cost": 18,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "pest_watch-hosta",
      "name": "Hosta slugs",
      "category": "slug",
      "tags": [
        "hosta",
        "shade"
      ],
      "cost": 12,
      "quantity": 2,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_pest_watch` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_pest_watch_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_pest_watch_coverage` | Show category coverage ratios and unknown categories. |
| `flag_pest_watch_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_pest_watch_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_pest_watch_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_pest_watch_baseline` | Compare category counts with the configured baseline. |
| `estimate_pest_watch_untreated_spots` | Calculate the primary metric for every item with mean and pass count. |
| `find_pest_watch_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_pest_watch_dependencies` | Map dependency groups and show which ones are missing. |
| `test_pest_watch_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_pest_watch_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_pest_watch_fixes` | Rank fixes by impact divided by effort. |
| `validate_pest_watch_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_pest_watch_duplicates` | Group items with the same category and normalized name. |
| `measure_pest_watch_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_pest_watch_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_pest_watch_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_pest_watch_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_pest_watch_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_pest_watch_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_pest_watch_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_pest_watch_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_pest_watch_next_steps` | Recommend the next five actions with quick wins. |
| `open_pest_watch_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
