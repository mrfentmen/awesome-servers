# Mister Sparky Booking Compare

Real local JSON analysis of mister sparky booking in the Mister Sparky lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/mister-sparky-booking-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "mister-sparky-booking-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/mister-sparky-booking-mcp"]
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
      "id": "mister_sparky_mister_sparky_booking-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "mister-sparky",
        "mister",
        "sparky"
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
      "id": "mister_sparky_mister_sparky_booking-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "mister-sparky",
        "mister",
        "sparky"
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
| `inventory_mister_sparky_mister_sparky_booking` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_mister_sparky_mister_sparky_booking_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_mister_sparky_mister_sparky_booking_coverage` | Show category coverage ratios and unknown categories. |
| `flag_mister_sparky_mister_sparky_booking_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_mister_sparky_mister_sparky_booking_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_mister_sparky_mister_sparky_booking_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_mister_sparky_mister_sparky_booking_baseline` | Compare category counts with the configured baseline. |
| `estimate_mister_sparky_mister_sparky_booking_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_mister_sparky_mister_sparky_booking_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_mister_sparky_mister_sparky_booking_dependencies` | Map dependency groups and show which ones are missing. |
| `test_mister_sparky_mister_sparky_booking_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_mister_sparky_mister_sparky_booking_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_mister_sparky_mister_sparky_booking_fixes` | Rank fixes by impact divided by effort. |
| `validate_mister_sparky_mister_sparky_booking_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_mister_sparky_mister_sparky_booking_duplicates` | Group items with the same category and normalized name. |
| `measure_mister_sparky_mister_sparky_booking_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_mister_sparky_mister_sparky_booking_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_mister_sparky_mister_sparky_booking_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_mister_sparky_mister_sparky_booking_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_mister_sparky_mister_sparky_booking_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_mister_sparky_mister_sparky_booking_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_mister_sparky_mister_sparky_booking_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_mister_sparky_mister_sparky_booking_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_mister_sparky_mister_sparky_booking_next_steps` | Recommend the next five actions with quick wins. |
| `open_mister_sparky_mister_sparky_booking_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
