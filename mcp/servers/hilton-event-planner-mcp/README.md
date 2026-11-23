# Hilton Event Planner Tracker

Real local JSON analysis of hilton event planner in the Hilton Event lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/hilton-event-planner-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "hilton-event-planner-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/hilton-event-planner-mcp"]
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
      "id": "hilton_event_hilton_event_planner-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "hilton-event",
        "hilton",
        "event"
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
      "id": "hilton_event_hilton_event_planner-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "hilton-event",
        "hilton",
        "event"
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
| `inventory_hilton_event_hilton_event_planner` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_hilton_event_hilton_event_planner_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_hilton_event_hilton_event_planner_coverage` | Show category coverage ratios and unknown categories. |
| `flag_hilton_event_hilton_event_planner_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_hilton_event_hilton_event_planner_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_hilton_event_hilton_event_planner_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_hilton_event_hilton_event_planner_baseline` | Compare category counts with the configured baseline. |
| `estimate_hilton_event_hilton_event_planner_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_hilton_event_hilton_event_planner_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_hilton_event_hilton_event_planner_dependencies` | Map dependency groups and show which ones are missing. |
| `test_hilton_event_hilton_event_planner_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_hilton_event_hilton_event_planner_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_hilton_event_hilton_event_planner_fixes` | Rank fixes by impact divided by effort. |
| `validate_hilton_event_hilton_event_planner_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_hilton_event_hilton_event_planner_duplicates` | Group items with the same category and normalized name. |
| `measure_hilton_event_hilton_event_planner_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_hilton_event_hilton_event_planner_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_hilton_event_hilton_event_planner_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_hilton_event_hilton_event_planner_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_hilton_event_hilton_event_planner_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_hilton_event_hilton_event_planner_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_hilton_event_hilton_event_planner_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_hilton_event_hilton_event_planner_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_hilton_event_hilton_event_planner_next_steps` | Recommend the next five actions with quick wins. |
| `open_hilton_event_hilton_event_planner_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
