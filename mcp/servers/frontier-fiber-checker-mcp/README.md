# Frontier Fiber Checker Tracker

Real local JSON analysis of frontier fiber checker in the Frontier Fiber lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/frontier-fiber-checker-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "frontier-fiber-checker-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/frontier-fiber-checker-mcp"]
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
      "id": "frontier_fiber_frontier_fiber_checker-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "frontier-fiber",
        "frontier",
        "fiber"
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
      "id": "frontier_fiber_frontier_fiber_checker-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "frontier-fiber",
        "frontier",
        "fiber"
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
| `inventory_frontier_fiber_frontier_fiber_checker` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_frontier_fiber_frontier_fiber_checker_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_frontier_fiber_frontier_fiber_checker_coverage` | Show category coverage ratios and unknown categories. |
| `flag_frontier_fiber_frontier_fiber_checker_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_frontier_fiber_frontier_fiber_checker_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_frontier_fiber_frontier_fiber_checker_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_frontier_fiber_frontier_fiber_checker_baseline` | Compare category counts with the configured baseline. |
| `estimate_frontier_fiber_frontier_fiber_checker_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_frontier_fiber_frontier_fiber_checker_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_frontier_fiber_frontier_fiber_checker_dependencies` | Map dependency groups and show which ones are missing. |
| `test_frontier_fiber_frontier_fiber_checker_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_frontier_fiber_frontier_fiber_checker_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_frontier_fiber_frontier_fiber_checker_fixes` | Rank fixes by impact divided by effort. |
| `validate_frontier_fiber_frontier_fiber_checker_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_frontier_fiber_frontier_fiber_checker_duplicates` | Group items with the same category and normalized name. |
| `measure_frontier_fiber_frontier_fiber_checker_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_frontier_fiber_frontier_fiber_checker_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_frontier_fiber_frontier_fiber_checker_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_frontier_fiber_frontier_fiber_checker_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_frontier_fiber_frontier_fiber_checker_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_frontier_fiber_frontier_fiber_checker_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_frontier_fiber_frontier_fiber_checker_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_frontier_fiber_frontier_fiber_checker_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_frontier_fiber_frontier_fiber_checker_next_steps` | Recommend the next five actions with quick wins. |
| `open_frontier_fiber_frontier_fiber_checker_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
