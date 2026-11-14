# Road Trip EV Audit

Audit EV trip charging stops, range, route and backup plans. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/travel-roadtrip-ev-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "travel-roadtrip-ev-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/travel-roadtrip-ev-check-mcp"]
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
      "id": "ev-charger",
      "name": "Fast charger stop",
      "category": "charger",
      "tags": [
        "dc"
      ],
      "cost": 20,
      "quantity": 250,
      "condition": "good"
    },
    {
      "id": "ev-route",
      "name": "Highway route",
      "category": "route",
      "tags": [
        "direct"
      ],
      "cost": 0,
      "quantity": 180,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_roadtrip_ev` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_roadtrip_ev_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_roadtrip_ev_coverage` | Show category coverage ratios and unknown categories. |
| `flag_roadtrip_ev_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_roadtrip_ev_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_roadtrip_ev_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_roadtrip_ev_baseline` | Compare category counts with the configured baseline. |
| `estimate_roadtrip_ev_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_roadtrip_ev_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_roadtrip_ev_dependencies` | Map dependency groups and show which ones are missing. |
| `test_roadtrip_ev_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_roadtrip_ev_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_roadtrip_ev_fixes` | Rank fixes by impact divided by effort. |
| `validate_roadtrip_ev_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_roadtrip_ev_duplicates` | Group items with the same category and normalized name. |
| `measure_roadtrip_ev_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_roadtrip_ev_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_roadtrip_ev_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_roadtrip_ev_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_roadtrip_ev_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_roadtrip_ev_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_roadtrip_ev_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_roadtrip_ev_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_roadtrip_ev_next_steps` | Recommend the next five actions with quick wins. |
| `open_roadtrip_ev_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
