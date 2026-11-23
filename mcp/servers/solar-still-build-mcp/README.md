# Solar Still Build Simulator

Real local JSON analysis of solar still build in the Solar Still lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/solar-still-build-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "solar-still-build-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/solar-still-build-mcp"]
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
      "id": "solar_still_solar_still_build-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "solar-still",
        "solar",
        "still"
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
      "id": "solar_still_solar_still_build-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "solar-still",
        "solar",
        "still"
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
| `inventory_solar_still_solar_still_build` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_solar_still_solar_still_build_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_solar_still_solar_still_build_coverage` | Show category coverage ratios and unknown categories. |
| `flag_solar_still_solar_still_build_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_solar_still_solar_still_build_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_solar_still_solar_still_build_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_solar_still_solar_still_build_baseline` | Compare category counts with the configured baseline. |
| `estimate_solar_still_solar_still_build_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_solar_still_solar_still_build_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_solar_still_solar_still_build_dependencies` | Map dependency groups and show which ones are missing. |
| `test_solar_still_solar_still_build_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_solar_still_solar_still_build_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_solar_still_solar_still_build_fixes` | Rank fixes by impact divided by effort. |
| `validate_solar_still_solar_still_build_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_solar_still_solar_still_build_duplicates` | Group items with the same category and normalized name. |
| `measure_solar_still_solar_still_build_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_solar_still_solar_still_build_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_solar_still_solar_still_build_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_solar_still_solar_still_build_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_solar_still_solar_still_build_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_solar_still_solar_still_build_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_solar_still_solar_still_build_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_solar_still_solar_still_build_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_solar_still_solar_still_build_next_steps` | Recommend the next five actions with quick wins. |
| `open_solar_still_solar_still_build_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
