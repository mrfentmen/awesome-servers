# Tide Chart Read Matcher

Real local JSON analysis of tide chart read in the Tide Chart lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/tide-chart-read-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "tide-chart-read-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/tide-chart-read-mcp"]
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
      "id": "tide_chart_tide_chart_read-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "tide-chart",
        "tide",
        "chart"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "tide_chart_tide_chart_read-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "tide-chart",
        "tide",
        "chart"
      ],
      "cost": 35,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_tide_chart_tide_chart_read` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_tide_chart_tide_chart_read_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_tide_chart_tide_chart_read_coverage` | Show category coverage ratios and unknown categories. |
| `flag_tide_chart_tide_chart_read_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_tide_chart_tide_chart_read_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_tide_chart_tide_chart_read_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_tide_chart_tide_chart_read_baseline` | Compare category counts with the configured baseline. |
| `estimate_tide_chart_tide_chart_read_clearance_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_tide_chart_tide_chart_read_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_tide_chart_tide_chart_read_dependencies` | Map dependency groups and show which ones are missing. |
| `test_tide_chart_tide_chart_read_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_tide_chart_tide_chart_read_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_tide_chart_tide_chart_read_fixes` | Rank fixes by impact divided by effort. |
| `validate_tide_chart_tide_chart_read_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_tide_chart_tide_chart_read_duplicates` | Group items with the same category and normalized name. |
| `measure_tide_chart_tide_chart_read_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_tide_chart_tide_chart_read_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_tide_chart_tide_chart_read_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_tide_chart_tide_chart_read_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_tide_chart_tide_chart_read_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_tide_chart_tide_chart_read_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_tide_chart_tide_chart_read_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_tide_chart_tide_chart_read_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_tide_chart_tide_chart_read_next_steps` | Recommend the next five actions with quick wins. |
| `open_tide_chart_tide_chart_read_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
