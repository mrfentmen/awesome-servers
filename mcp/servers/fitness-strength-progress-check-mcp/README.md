# Strength Progress Audit

Audit strength progress by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/fitness-strength-progress-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "fitness-strength-progress-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/fitness-strength-progress-check-mcp"]
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
      "id": "strength_progress-back-squat",
      "name": "Back squat",
      "category": "squat",
      "tags": [
        "barbell",
        "lower"
      ],
      "cost": 0,
      "quantity": 3.2,
      "condition": "good"
    },
    {
      "id": "strength_progress-front-squat",
      "name": "Front squat",
      "category": "squat",
      "tags": [
        "barbell",
        "quad"
      ],
      "cost": 0,
      "quantity": 1.8,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_strength_progress` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_strength_progress_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_strength_progress_coverage` | Show category coverage ratios and unknown categories. |
| `flag_strength_progress_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_strength_progress_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_strength_progress_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_strength_progress_baseline` | Compare category counts with the configured baseline. |
| `estimate_strength_progress_progress_pct` | Calculate the primary metric for every item with mean and pass count. |
| `find_strength_progress_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_strength_progress_dependencies` | Map dependency groups and show which ones are missing. |
| `test_strength_progress_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_strength_progress_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_strength_progress_fixes` | Rank fixes by impact divided by effort. |
| `validate_strength_progress_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_strength_progress_duplicates` | Group items with the same category and normalized name. |
| `measure_strength_progress_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_strength_progress_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_strength_progress_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_strength_progress_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_strength_progress_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_strength_progress_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_strength_progress_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_strength_progress_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_strength_progress_next_steps` | Recommend the next five actions with quick wins. |
| `open_strength_progress_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
