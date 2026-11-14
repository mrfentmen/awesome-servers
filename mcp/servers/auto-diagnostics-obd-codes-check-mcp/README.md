# OBD-II Codes Audit

Audit OBD-II fault codes by system and severity. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/auto-diagnostics-obd-codes-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "auto-diagnostics-obd-codes-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/auto-diagnostics-obd-codes-check-mcp"]
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
      "id": "obd-engine",
      "name": "P0301 misfire",
      "category": "engine",
      "tags": [
        "critical"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "obd-trans",
      "name": "P0700 transmission",
      "category": "transmission",
      "tags": [
        "warning"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "fair"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_obd_codes` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_obd_codes_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_obd_codes_coverage` | Show category coverage ratios and unknown categories. |
| `flag_obd_codes_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_obd_codes_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_obd_codes_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_obd_codes_baseline` | Compare category counts with the configured baseline. |
| `estimate_obd_codes_dtc_severity` | Calculate the primary metric for every item with mean and pass count. |
| `find_obd_codes_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_obd_codes_dependencies` | Map dependency groups and show which ones are missing. |
| `test_obd_codes_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_obd_codes_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_obd_codes_fixes` | Rank fixes by impact divided by effort. |
| `validate_obd_codes_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_obd_codes_duplicates` | Group items with the same category and normalized name. |
| `measure_obd_codes_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_obd_codes_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_obd_codes_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_obd_codes_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_obd_codes_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_obd_codes_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_obd_codes_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_obd_codes_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_obd_codes_next_steps` | Recommend the next five actions with quick wins. |
| `open_obd_codes_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
