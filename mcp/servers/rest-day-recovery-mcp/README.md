# Rest Day Recovery Audit

Real local JSON analysis of rest day recovery in the Strength Plan lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/rest-day-recovery-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "rest-day-recovery-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/rest-day-recovery-mcp"]
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
      "id": "strength_plan_rest_day_recovery-steps-1",
      "name": "Steps primary",
      "category": "steps",
      "tags": [
        "strength-plan",
        "rest",
        "day"
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
      "id": "strength_plan_rest_day_recovery-tools-2",
      "name": "Tools primary",
      "category": "tools",
      "tags": [
        "strength-plan",
        "rest",
        "day"
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
| `inventory_strength_plan_rest_day_recovery` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_strength_plan_rest_day_recovery_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_strength_plan_rest_day_recovery_coverage` | Show category coverage ratios and unknown categories. |
| `flag_strength_plan_rest_day_recovery_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_strength_plan_rest_day_recovery_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_strength_plan_rest_day_recovery_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_strength_plan_rest_day_recovery_baseline` | Compare category counts with the configured baseline. |
| `estimate_strength_plan_rest_day_recovery_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_strength_plan_rest_day_recovery_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_strength_plan_rest_day_recovery_dependencies` | Map dependency groups and show which ones are missing. |
| `test_strength_plan_rest_day_recovery_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_strength_plan_rest_day_recovery_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_strength_plan_rest_day_recovery_fixes` | Rank fixes by impact divided by effort. |
| `validate_strength_plan_rest_day_recovery_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_strength_plan_rest_day_recovery_duplicates` | Group items with the same category and normalized name. |
| `measure_strength_plan_rest_day_recovery_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_strength_plan_rest_day_recovery_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_strength_plan_rest_day_recovery_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_strength_plan_rest_day_recovery_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_strength_plan_rest_day_recovery_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_strength_plan_rest_day_recovery_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_strength_plan_rest_day_recovery_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_strength_plan_rest_day_recovery_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_strength_plan_rest_day_recovery_next_steps` | Recommend the next five actions with quick wins. |
| `open_strength_plan_rest_day_recovery_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
