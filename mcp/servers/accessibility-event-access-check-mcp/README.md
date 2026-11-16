# Event Access Audit

Audit event access by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/accessibility-event-access-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "accessibility-event-access-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/accessibility-event-access-check-mcp"]
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
      "id": "event_access-seating",
      "name": "Accessible seating",
      "category": "seating",
      "tags": [
        "companion",
        "sightline"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "event_access-seating-extra",
      "name": "Extra seating row",
      "category": "seating",
      "tags": [
        "limited",
        "side"
      ],
      "cost": 500,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_event_access` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_event_access_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_event_access_coverage` | Show category coverage ratios and unknown categories. |
| `flag_event_access_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_event_access_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_event_access_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_event_access_baseline` | Compare category counts with the configured baseline. |
| `estimate_event_access_barrier_count` | Calculate the primary metric for every item with mean and pass count. |
| `find_event_access_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_event_access_dependencies` | Map dependency groups and show which ones are missing. |
| `test_event_access_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_event_access_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_event_access_fixes` | Rank fixes by impact divided by effort. |
| `validate_event_access_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_event_access_duplicates` | Group items with the same category and normalized name. |
| `measure_event_access_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_event_access_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_event_access_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_event_access_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_event_access_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_event_access_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_event_access_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_event_access_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_event_access_next_steps` | Recommend the next five actions with quick wins. |
| `open_event_access_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
