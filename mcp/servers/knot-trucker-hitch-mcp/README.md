# Knot Trucker Hitch Compare

Real local JSON analysis of knot trucker hitch in the Knot Trucker lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/knot-trucker-hitch-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "knot-trucker-hitch-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/knot-trucker-hitch-mcp"]
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
      "id": "knot_trucker_knot_trucker_hitch-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "knot-trucker",
        "knot",
        "trucker"
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
      "id": "knot_trucker_knot_trucker_hitch-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "knot-trucker",
        "knot",
        "trucker"
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
| `inventory_knot_trucker_knot_trucker_hitch` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_knot_trucker_knot_trucker_hitch_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_knot_trucker_knot_trucker_hitch_coverage` | Show category coverage ratios and unknown categories. |
| `flag_knot_trucker_knot_trucker_hitch_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_knot_trucker_knot_trucker_hitch_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_knot_trucker_knot_trucker_hitch_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_knot_trucker_knot_trucker_hitch_baseline` | Compare category counts with the configured baseline. |
| `estimate_knot_trucker_knot_trucker_hitch_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_knot_trucker_knot_trucker_hitch_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_knot_trucker_knot_trucker_hitch_dependencies` | Map dependency groups and show which ones are missing. |
| `test_knot_trucker_knot_trucker_hitch_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_knot_trucker_knot_trucker_hitch_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_knot_trucker_knot_trucker_hitch_fixes` | Rank fixes by impact divided by effort. |
| `validate_knot_trucker_knot_trucker_hitch_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_knot_trucker_knot_trucker_hitch_duplicates` | Group items with the same category and normalized name. |
| `measure_knot_trucker_knot_trucker_hitch_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_knot_trucker_knot_trucker_hitch_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_knot_trucker_knot_trucker_hitch_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_knot_trucker_knot_trucker_hitch_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_knot_trucker_knot_trucker_hitch_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_knot_trucker_knot_trucker_hitch_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_knot_trucker_knot_trucker_hitch_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_knot_trucker_knot_trucker_hitch_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_knot_trucker_knot_trucker_hitch_next_steps` | Recommend the next five actions with quick wins. |
| `open_knot_trucker_knot_trucker_hitch_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
