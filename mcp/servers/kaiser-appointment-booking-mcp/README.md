# Kaiser Appointment Booking Tracker

Real local JSON analysis of kaiser appointment booking in the Kaiser Appointment lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/kaiser-appointment-booking-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "kaiser-appointment-booking-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/kaiser-appointment-booking-mcp"]
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
      "id": "kaiser_appointment_kaiser_appointment_booking-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "kaiser-appointment",
        "kaiser",
        "appointment"
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
      "id": "kaiser_appointment_kaiser_appointment_booking-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "kaiser-appointment",
        "kaiser",
        "appointment"
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
| `inventory_kaiser_appointment_kaiser_appointment_booking` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_kaiser_appointment_kaiser_appointment_booking_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_kaiser_appointment_kaiser_appointment_booking_coverage` | Show category coverage ratios and unknown categories. |
| `flag_kaiser_appointment_kaiser_appointment_booking_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_kaiser_appointment_kaiser_appointment_booking_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_kaiser_appointment_kaiser_appointment_booking_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_kaiser_appointment_kaiser_appointment_booking_baseline` | Compare category counts with the configured baseline. |
| `estimate_kaiser_appointment_kaiser_appointment_booking_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_kaiser_appointment_kaiser_appointment_booking_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_kaiser_appointment_kaiser_appointment_booking_dependencies` | Map dependency groups and show which ones are missing. |
| `test_kaiser_appointment_kaiser_appointment_booking_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_kaiser_appointment_kaiser_appointment_booking_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_kaiser_appointment_kaiser_appointment_booking_fixes` | Rank fixes by impact divided by effort. |
| `validate_kaiser_appointment_kaiser_appointment_booking_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_kaiser_appointment_kaiser_appointment_booking_duplicates` | Group items with the same category and normalized name. |
| `measure_kaiser_appointment_kaiser_appointment_booking_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_kaiser_appointment_kaiser_appointment_booking_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_kaiser_appointment_kaiser_appointment_booking_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_kaiser_appointment_kaiser_appointment_booking_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_kaiser_appointment_kaiser_appointment_booking_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_kaiser_appointment_kaiser_appointment_booking_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_kaiser_appointment_kaiser_appointment_booking_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_kaiser_appointment_kaiser_appointment_booking_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_kaiser_appointment_kaiser_appointment_booking_next_steps` | Recommend the next five actions with quick wins. |
| `open_kaiser_appointment_kaiser_appointment_booking_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
