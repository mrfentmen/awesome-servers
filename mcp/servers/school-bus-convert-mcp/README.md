# School Bus Convert Planner

Real local JSON analysis of school bus convert in the School Bus lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/school-bus-convert-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "school-bus-convert-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/school-bus-convert-mcp"]
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
      "id": "school_bus_school_bus_convert-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "school-bus",
        "school",
        "bus"
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
      "id": "school_bus_school_bus_convert-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "school-bus",
        "school",
        "bus"
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
| `inventory_school_bus_school_bus_convert` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_school_bus_school_bus_convert_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_school_bus_school_bus_convert_coverage` | Show category coverage ratios and unknown categories. |
| `flag_school_bus_school_bus_convert_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_school_bus_school_bus_convert_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_school_bus_school_bus_convert_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_school_bus_school_bus_convert_baseline` | Compare category counts with the configured baseline. |
| `estimate_school_bus_school_bus_convert_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_school_bus_school_bus_convert_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_school_bus_school_bus_convert_dependencies` | Map dependency groups and show which ones are missing. |
| `test_school_bus_school_bus_convert_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_school_bus_school_bus_convert_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_school_bus_school_bus_convert_fixes` | Rank fixes by impact divided by effort. |
| `validate_school_bus_school_bus_convert_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_school_bus_school_bus_convert_duplicates` | Group items with the same category and normalized name. |
| `measure_school_bus_school_bus_convert_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_school_bus_school_bus_convert_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_school_bus_school_bus_convert_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_school_bus_school_bus_convert_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_school_bus_school_bus_convert_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_school_bus_school_bus_convert_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_school_bus_school_bus_convert_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_school_bus_school_bus_convert_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_school_bus_school_bus_convert_next_steps` | Recommend the next five actions with quick wins. |
| `open_school_bus_school_bus_convert_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
