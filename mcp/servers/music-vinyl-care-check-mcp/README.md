# Vinyl Care Audit

Audit records, sleeves, brushes and styli for play grade and care coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/music-vinyl-care-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "music-vinyl-care-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/music-vinyl-care-check-mcp"]
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
      "id": "vinyl-record",
      "name": "Vintage LP",
      "category": "record",
      "tags": [
        "jazz"
      ],
      "cost": 30,
      "quantity": 85,
      "condition": "good"
    },
    {
      "id": "vinyl-sleeve",
      "name": "Inner sleeve",
      "category": "sleeve",
      "tags": [
        "paper"
      ],
      "cost": 2,
      "quantity": 70,
      "condition": "fair"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_vinyl_care` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_vinyl_care_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_vinyl_care_coverage` | Show category coverage ratios and unknown categories. |
| `flag_vinyl_care_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_vinyl_care_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_vinyl_care_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_vinyl_care_baseline` | Compare category counts with the configured baseline. |
| `estimate_vinyl_care_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_vinyl_care_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_vinyl_care_dependencies` | Map dependency groups and show which ones are missing. |
| `test_vinyl_care_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_vinyl_care_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_vinyl_care_fixes` | Rank fixes by impact divided by effort. |
| `validate_vinyl_care_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_vinyl_care_duplicates` | Group items with the same category and normalized name. |
| `measure_vinyl_care_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_vinyl_care_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_vinyl_care_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_vinyl_care_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_vinyl_care_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_vinyl_care_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_vinyl_care_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_vinyl_care_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_vinyl_care_next_steps` | Recommend the next five actions with quick wins. |
| `open_vinyl_care_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
