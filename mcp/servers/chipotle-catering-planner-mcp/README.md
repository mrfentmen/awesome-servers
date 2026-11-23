# Chipotle Catering Planner Tracker

Real local JSON analysis of chipotle catering planner in the Chipotle Catering lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/chipotle-catering-planner-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "chipotle-catering-planner-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/chipotle-catering-planner-mcp"]
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
      "id": "chipotle_catering_chipotle_catering_planner-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "chipotle-catering",
        "chipotle",
        "catering"
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
      "id": "chipotle_catering_chipotle_catering_planner-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "chipotle-catering",
        "chipotle",
        "catering"
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
| `inventory_chipotle_catering_chipotle_catering_planner` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_chipotle_catering_chipotle_catering_planner_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_chipotle_catering_chipotle_catering_planner_coverage` | Show category coverage ratios and unknown categories. |
| `flag_chipotle_catering_chipotle_catering_planner_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_chipotle_catering_chipotle_catering_planner_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_chipotle_catering_chipotle_catering_planner_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_chipotle_catering_chipotle_catering_planner_baseline` | Compare category counts with the configured baseline. |
| `estimate_chipotle_catering_chipotle_catering_planner_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_chipotle_catering_chipotle_catering_planner_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_chipotle_catering_chipotle_catering_planner_dependencies` | Map dependency groups and show which ones are missing. |
| `test_chipotle_catering_chipotle_catering_planner_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_chipotle_catering_chipotle_catering_planner_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_chipotle_catering_chipotle_catering_planner_fixes` | Rank fixes by impact divided by effort. |
| `validate_chipotle_catering_chipotle_catering_planner_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_chipotle_catering_chipotle_catering_planner_duplicates` | Group items with the same category and normalized name. |
| `measure_chipotle_catering_chipotle_catering_planner_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_chipotle_catering_chipotle_catering_planner_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_chipotle_catering_chipotle_catering_planner_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_chipotle_catering_chipotle_catering_planner_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_chipotle_catering_chipotle_catering_planner_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_chipotle_catering_chipotle_catering_planner_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_chipotle_catering_chipotle_catering_planner_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_chipotle_catering_chipotle_catering_planner_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_chipotle_catering_chipotle_catering_planner_next_steps` | Recommend the next five actions with quick wins. |
| `open_chipotle_catering_chipotle_catering_planner_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
