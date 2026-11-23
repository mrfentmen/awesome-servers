# State Dept Travel Tracker

Real local JSON analysis of state dept travel in the State Dept lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/state-dept-travel-advisory-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "state-dept-travel-advisory-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/state-dept-travel-advisory-mcp"]
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
      "id": "state_dept_state_dept_travel_advisory-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "state-dept",
        "state",
        "dept"
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
      "id": "state_dept_state_dept_travel_advisory-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "state-dept",
        "state",
        "dept"
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
| `inventory_state_dept_state_dept_travel_advisory` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_state_dept_state_dept_travel_advisory_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_state_dept_state_dept_travel_advisory_coverage` | Show category coverage ratios and unknown categories. |
| `flag_state_dept_state_dept_travel_advisory_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_state_dept_state_dept_travel_advisory_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_state_dept_state_dept_travel_advisory_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_state_dept_state_dept_travel_advisory_baseline` | Compare category counts with the configured baseline. |
| `estimate_state_dept_state_dept_travel_advisory_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_state_dept_state_dept_travel_advisory_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_state_dept_state_dept_travel_advisory_dependencies` | Map dependency groups and show which ones are missing. |
| `test_state_dept_state_dept_travel_advisory_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_state_dept_state_dept_travel_advisory_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_state_dept_state_dept_travel_advisory_fixes` | Rank fixes by impact divided by effort. |
| `validate_state_dept_state_dept_travel_advisory_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_state_dept_state_dept_travel_advisory_duplicates` | Group items with the same category and normalized name. |
| `measure_state_dept_state_dept_travel_advisory_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_state_dept_state_dept_travel_advisory_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_state_dept_state_dept_travel_advisory_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_state_dept_state_dept_travel_advisory_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_state_dept_state_dept_travel_advisory_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_state_dept_state_dept_travel_advisory_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_state_dept_state_dept_travel_advisory_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_state_dept_state_dept_travel_advisory_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_state_dept_state_dept_travel_advisory_next_steps` | Recommend the next five actions with quick wins. |
| `open_state_dept_state_dept_travel_advisory_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
