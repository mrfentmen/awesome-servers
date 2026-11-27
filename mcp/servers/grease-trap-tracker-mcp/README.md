# grease trap tracker Tracker

Real local JSON analysis of grease trap tracker in the Water & Waste lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/grease-trap-tracker-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "grease-trap-tracker-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/grease-trap-tracker-mcp"]
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
      "id": "util_grease_trap_tracker-util-1",
      "name": "util primary",
      "category": "util",
      "tags": [
        "water-waste",
        "grease",
        "trap"
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
      "id": "util_grease_trap_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "water-waste",
        "grease",
        "trap"
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
| `inventory_util_grease_trap_tracker` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_util_grease_trap_tracker_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_util_grease_trap_tracker_coverage` | Show category coverage ratios and unknown categories. |
| `flag_util_grease_trap_tracker_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_util_grease_trap_tracker_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_util_grease_trap_tracker_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_util_grease_trap_tracker_baseline` | Compare category counts with the configured baseline. |
| `estimate_util_grease_trap_tracker_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_util_grease_trap_tracker_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_util_grease_trap_tracker_dependencies` | Map dependency groups and show which ones are missing. |
| `test_util_grease_trap_tracker_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_util_grease_trap_tracker_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_util_grease_trap_tracker_fixes` | Rank fixes by impact divided by effort. |
| `validate_util_grease_trap_tracker_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_util_grease_trap_tracker_duplicates` | Group items with the same category and normalized name. |
| `measure_util_grease_trap_tracker_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_util_grease_trap_tracker_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_util_grease_trap_tracker_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_util_grease_trap_tracker_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_util_grease_trap_tracker_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_util_grease_trap_tracker_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_util_grease_trap_tracker_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_util_grease_trap_tracker_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_util_grease_trap_tracker_next_steps` | Recommend the next five actions with quick wins. |
| `open_util_grease_trap_tracker_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
