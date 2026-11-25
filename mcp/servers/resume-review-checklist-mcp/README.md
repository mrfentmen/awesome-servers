# resume review checklist Checklist

Real local JSON analysis of resume review checklist in the Work & Trades lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/resume-review-checklist-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "resume-review-checklist-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/resume-review-checklist-mcp"]
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
      "id": "work_resume_review_checklist-work-1",
      "name": "work primary",
      "category": "work",
      "tags": [
        "work-trades",
        "resume",
        "review"
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
      "id": "work_resume_review_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "work-trades",
        "resume",
        "review"
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
| `inventory_work_resume_review_checklist` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_work_resume_review_checklist_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_work_resume_review_checklist_coverage` | Show category coverage ratios and unknown categories. |
| `flag_work_resume_review_checklist_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_work_resume_review_checklist_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_work_resume_review_checklist_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_work_resume_review_checklist_baseline` | Compare category counts with the configured baseline. |
| `estimate_work_resume_review_checklist_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_work_resume_review_checklist_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_work_resume_review_checklist_dependencies` | Map dependency groups and show which ones are missing. |
| `test_work_resume_review_checklist_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_work_resume_review_checklist_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_work_resume_review_checklist_fixes` | Rank fixes by impact divided by effort. |
| `validate_work_resume_review_checklist_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_work_resume_review_checklist_duplicates` | Group items with the same category and normalized name. |
| `measure_work_resume_review_checklist_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_work_resume_review_checklist_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_work_resume_review_checklist_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_work_resume_review_checklist_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_work_resume_review_checklist_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_work_resume_review_checklist_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_work_resume_review_checklist_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_work_resume_review_checklist_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_work_resume_review_checklist_next_steps` | Recommend the next five actions with quick wins. |
| `open_work_resume_review_checklist_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
