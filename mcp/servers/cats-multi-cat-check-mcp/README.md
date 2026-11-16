# Multi-Cat Tension Audit

Audit multi-cat tension by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/cats-multi-cat-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "cats-multi-cat-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/cats-multi-cat-check-mcp"]
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
      "id": "multi_cat-food",
      "name": "Separate feeding station",
      "category": "food",
      "tags": [
        "separated",
        "timed"
      ],
      "cost": 30,
      "quantity": 2,
      "condition": "fair"
    },
    {
      "id": "multi_cat-litter1",
      "name": "Litter box one",
      "category": "litter",
      "tags": [
        "covered",
        "daily"
      ],
      "cost": 25,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_multi_cat` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_multi_cat_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_multi_cat_coverage` | Show category coverage ratios and unknown categories. |
| `flag_multi_cat_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_multi_cat_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_multi_cat_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_multi_cat_baseline` | Compare category counts with the configured baseline. |
| `estimate_multi_cat_conflict_events` | Calculate the primary metric for every item with mean and pass count. |
| `find_multi_cat_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_multi_cat_dependencies` | Map dependency groups and show which ones are missing. |
| `test_multi_cat_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_multi_cat_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_multi_cat_fixes` | Rank fixes by impact divided by effort. |
| `validate_multi_cat_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_multi_cat_duplicates` | Group items with the same category and normalized name. |
| `measure_multi_cat_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_multi_cat_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_multi_cat_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_multi_cat_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_multi_cat_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_multi_cat_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_multi_cat_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_multi_cat_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_multi_cat_next_steps` | Recommend the next five actions with quick wins. |
| `open_multi_cat_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
