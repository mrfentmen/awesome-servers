# Indoor VOC Audit

Audit indoor VOC readings, room coverage, ventilation and test equipment. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/air-quality-indoor-voc-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "air-quality-indoor-voc-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/air-quality-indoor-voc-check-mcp"]
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
      "id": "indoor_voc-living-room-sensor",
      "name": "Living room sensor",
      "category": "living",
      "tags": [
        "living"
      ],
      "cost": 120,
      "quantity": 180,
      "condition": "fair"
    },
    {
      "id": "indoor_voc-bedroom-sensor",
      "name": "Bedroom sensor",
      "category": "bedroom",
      "tags": [
        "bedroom"
      ],
      "cost": 120,
      "quantity": 90,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_indoor_voc` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_indoor_voc_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_indoor_voc_coverage` | Show category coverage ratios and unknown categories. |
| `flag_indoor_voc_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_indoor_voc_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_indoor_voc_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_indoor_voc_baseline` | Compare category counts with the configured baseline. |
| `estimate_indoor_voc_voc_index` | Calculate the primary metric for every item with mean and pass count. |
| `find_indoor_voc_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_indoor_voc_dependencies` | Map dependency groups and show which ones are missing. |
| `test_indoor_voc_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_indoor_voc_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_indoor_voc_fixes` | Rank fixes by impact divided by effort. |
| `validate_indoor_voc_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_indoor_voc_duplicates` | Group items with the same category and normalized name. |
| `measure_indoor_voc_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_indoor_voc_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_indoor_voc_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_indoor_voc_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_indoor_voc_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_indoor_voc_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_indoor_voc_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_indoor_voc_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_indoor_voc_next_steps` | Recommend the next five actions with quick wins. |
| `open_indoor_voc_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
