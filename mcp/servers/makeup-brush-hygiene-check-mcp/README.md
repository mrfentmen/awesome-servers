# Brush Hygiene Audit

Audit brush hygiene by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/makeup-brush-hygiene-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "makeup-brush-hygiene-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/makeup-brush-hygiene-check-mcp"]
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
      "id": "brush_hygiene-foundation",
      "name": "Foundation brush",
      "category": "face",
      "tags": [
        "synthetic",
        "daily"
      ],
      "cost": 25,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "brush_hygiene-powder",
      "name": "Powder brush",
      "category": "face",
      "tags": [
        "natural",
        "weekly"
      ],
      "cost": 30,
      "quantity": 20,
      "condition": "fair"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_brush_hygiene` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_brush_hygiene_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_brush_hygiene_coverage` | Show category coverage ratios and unknown categories. |
| `flag_brush_hygiene_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_brush_hygiene_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_brush_hygiene_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_brush_hygiene_baseline` | Compare category counts with the configured baseline. |
| `estimate_brush_hygiene_days_since_wash` | Calculate the primary metric for every item with mean and pass count. |
| `find_brush_hygiene_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_brush_hygiene_dependencies` | Map dependency groups and show which ones are missing. |
| `test_brush_hygiene_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_brush_hygiene_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_brush_hygiene_fixes` | Rank fixes by impact divided by effort. |
| `validate_brush_hygiene_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_brush_hygiene_duplicates` | Group items with the same category and normalized name. |
| `measure_brush_hygiene_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_brush_hygiene_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_brush_hygiene_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_brush_hygiene_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_brush_hygiene_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_brush_hygiene_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_brush_hygiene_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_brush_hygiene_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_brush_hygiene_next_steps` | Recommend the next five actions with quick wins. |
| `open_brush_hygiene_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
