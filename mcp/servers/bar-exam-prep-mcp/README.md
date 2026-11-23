# Bar Exam Prep Simulator

Real local JSON analysis of bar exam prep in the Bar Exam lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/bar-exam-prep-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "bar-exam-prep-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/bar-exam-prep-mcp"]
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
      "id": "bar_exam_bar_exam_prep-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "bar-exam",
        "bar",
        "exam"
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
      "id": "bar_exam_bar_exam_prep-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "bar-exam",
        "bar",
        "exam"
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
| `inventory_bar_exam_bar_exam_prep` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_bar_exam_bar_exam_prep_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_bar_exam_bar_exam_prep_coverage` | Show category coverage ratios and unknown categories. |
| `flag_bar_exam_bar_exam_prep_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_bar_exam_bar_exam_prep_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_bar_exam_bar_exam_prep_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_bar_exam_bar_exam_prep_baseline` | Compare category counts with the configured baseline. |
| `estimate_bar_exam_bar_exam_prep_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_bar_exam_bar_exam_prep_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_bar_exam_bar_exam_prep_dependencies` | Map dependency groups and show which ones are missing. |
| `test_bar_exam_bar_exam_prep_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_bar_exam_bar_exam_prep_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_bar_exam_bar_exam_prep_fixes` | Rank fixes by impact divided by effort. |
| `validate_bar_exam_bar_exam_prep_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_bar_exam_bar_exam_prep_duplicates` | Group items with the same category and normalized name. |
| `measure_bar_exam_bar_exam_prep_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_bar_exam_bar_exam_prep_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_bar_exam_bar_exam_prep_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_bar_exam_bar_exam_prep_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_bar_exam_bar_exam_prep_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_bar_exam_bar_exam_prep_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_bar_exam_bar_exam_prep_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_bar_exam_bar_exam_prep_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_bar_exam_bar_exam_prep_next_steps` | Recommend the next five actions with quick wins. |
| `open_bar_exam_bar_exam_prep_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
