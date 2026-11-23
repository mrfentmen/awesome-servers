# Faa Flight Status Archive

Real local JSON analysis of faa flight status in the Faa Flight lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/faa-flight-status-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "faa-flight-status-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/faa-flight-status-mcp"]
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
      "id": "faa_flight_faa_flight_status-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "faa-flight",
        "faa",
        "flight"
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
      "id": "faa_flight_faa_flight_status-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "faa-flight",
        "faa",
        "flight"
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
| `inventory_faa_flight_faa_flight_status` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_faa_flight_faa_flight_status_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_faa_flight_faa_flight_status_coverage` | Show category coverage ratios and unknown categories. |
| `flag_faa_flight_faa_flight_status_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_faa_flight_faa_flight_status_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_faa_flight_faa_flight_status_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_faa_flight_faa_flight_status_baseline` | Compare category counts with the configured baseline. |
| `estimate_faa_flight_faa_flight_status_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_faa_flight_faa_flight_status_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_faa_flight_faa_flight_status_dependencies` | Map dependency groups and show which ones are missing. |
| `test_faa_flight_faa_flight_status_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_faa_flight_faa_flight_status_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_faa_flight_faa_flight_status_fixes` | Rank fixes by impact divided by effort. |
| `validate_faa_flight_faa_flight_status_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_faa_flight_faa_flight_status_duplicates` | Group items with the same category and normalized name. |
| `measure_faa_flight_faa_flight_status_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_faa_flight_faa_flight_status_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_faa_flight_faa_flight_status_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_faa_flight_faa_flight_status_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_faa_flight_faa_flight_status_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_faa_flight_faa_flight_status_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_faa_flight_faa_flight_status_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_faa_flight_faa_flight_status_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_faa_flight_faa_flight_status_next_steps` | Recommend the next five actions with quick wins. |
| `open_faa_flight_faa_flight_status_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
