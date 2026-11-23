# Hilton Room Service Tracker

Real local JSON analysis of hilton room service in the Hilton Room lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/hilton-room-service-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "hilton-room-service-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/hilton-room-service-mcp"]
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
      "id": "hilton_room_hilton_room_service-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "hilton-room",
        "hilton",
        "room"
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
      "id": "hilton_room_hilton_room_service-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "hilton-room",
        "hilton",
        "room"
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
| `inventory_hilton_room_hilton_room_service` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_hilton_room_hilton_room_service_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_hilton_room_hilton_room_service_coverage` | Show category coverage ratios and unknown categories. |
| `flag_hilton_room_hilton_room_service_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_hilton_room_hilton_room_service_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_hilton_room_hilton_room_service_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_hilton_room_hilton_room_service_baseline` | Compare category counts with the configured baseline. |
| `estimate_hilton_room_hilton_room_service_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_hilton_room_hilton_room_service_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_hilton_room_hilton_room_service_dependencies` | Map dependency groups and show which ones are missing. |
| `test_hilton_room_hilton_room_service_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_hilton_room_hilton_room_service_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_hilton_room_hilton_room_service_fixes` | Rank fixes by impact divided by effort. |
| `validate_hilton_room_hilton_room_service_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_hilton_room_hilton_room_service_duplicates` | Group items with the same category and normalized name. |
| `measure_hilton_room_hilton_room_service_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_hilton_room_hilton_room_service_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_hilton_room_hilton_room_service_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_hilton_room_hilton_room_service_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_hilton_room_hilton_room_service_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_hilton_room_hilton_room_service_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_hilton_room_hilton_room_service_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_hilton_room_hilton_room_service_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_hilton_room_hilton_room_service_next_steps` | Recommend the next five actions with quick wins. |
| `open_hilton_room_hilton_room_service_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
