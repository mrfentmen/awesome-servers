# Routine Conflict Audit

Audit routine conflict by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/skincare-routine-conflict-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "skincare-routine-conflict-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/skincare-routine-conflict-check-mcp"]
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
      "id": "routine_conflict-cleanser",
      "name": "Gel cleanser",
      "category": "cleanser",
      "tags": [
        "gentle",
        "daily"
      ],
      "cost": 22,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "routine_conflict-retinol",
      "name": "Retinol serum",
      "category": "active",
      "tags": [
        "retinol",
        "night"
      ],
      "cost": 38,
      "quantity": 2,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_routine_conflict` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_routine_conflict_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_routine_conflict_coverage` | Show category coverage ratios and unknown categories. |
| `flag_routine_conflict_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_routine_conflict_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_routine_conflict_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_routine_conflict_baseline` | Compare category counts with the configured baseline. |
| `estimate_routine_conflict_conflict_count` | Calculate the primary metric for every item with mean and pass count. |
| `find_routine_conflict_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_routine_conflict_dependencies` | Map dependency groups and show which ones are missing. |
| `test_routine_conflict_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_routine_conflict_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_routine_conflict_fixes` | Rank fixes by impact divided by effort. |
| `validate_routine_conflict_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_routine_conflict_duplicates` | Group items with the same category and normalized name. |
| `measure_routine_conflict_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_routine_conflict_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_routine_conflict_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_routine_conflict_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_routine_conflict_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_routine_conflict_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_routine_conflict_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_routine_conflict_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_routine_conflict_next_steps` | Recommend the next five actions with quick wins. |
| `open_routine_conflict_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
