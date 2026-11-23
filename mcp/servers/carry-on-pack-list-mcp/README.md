# Carry On Pack List Planner

Real local JSON analysis of carry on pack list in the Trip Ready lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/carry-on-pack-list-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "carry-on-pack-list-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/carry-on-pack-list-mcp"]
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
      "id": "trip_ready_carry_on_pack_list-rows-1",
      "name": "Rows primary",
      "category": "rows",
      "tags": [
        "trip-ready",
        "carry",
        "on"
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
      "id": "trip_ready_carry_on_pack_list-flags-2",
      "name": "Flags primary",
      "category": "flags",
      "tags": [
        "trip-ready",
        "carry",
        "on"
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
| `inventory_trip_ready_carry_on_pack_list` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_trip_ready_carry_on_pack_list_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_trip_ready_carry_on_pack_list_coverage` | Show category coverage ratios and unknown categories. |
| `flag_trip_ready_carry_on_pack_list_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_trip_ready_carry_on_pack_list_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_trip_ready_carry_on_pack_list_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_trip_ready_carry_on_pack_list_baseline` | Compare category counts with the configured baseline. |
| `estimate_trip_ready_carry_on_pack_list_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_trip_ready_carry_on_pack_list_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_trip_ready_carry_on_pack_list_dependencies` | Map dependency groups and show which ones are missing. |
| `test_trip_ready_carry_on_pack_list_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_trip_ready_carry_on_pack_list_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_trip_ready_carry_on_pack_list_fixes` | Rank fixes by impact divided by effort. |
| `validate_trip_ready_carry_on_pack_list_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_trip_ready_carry_on_pack_list_duplicates` | Group items with the same category and normalized name. |
| `measure_trip_ready_carry_on_pack_list_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_trip_ready_carry_on_pack_list_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_trip_ready_carry_on_pack_list_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_trip_ready_carry_on_pack_list_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_trip_ready_carry_on_pack_list_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_trip_ready_carry_on_pack_list_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_trip_ready_carry_on_pack_list_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_trip_ready_carry_on_pack_list_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_trip_ready_carry_on_pack_list_next_steps` | Recommend the next five actions with quick wins. |
| `open_trip_ready_carry_on_pack_list_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
