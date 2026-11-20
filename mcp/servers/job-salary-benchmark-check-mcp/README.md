# Salary Benchmark Audit

Audit salary benchmark by title, location, experience, range coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/job-salary-benchmark-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "job-salary-benchmark-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/job-salary-benchmark-check-mcp"]
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
      "id": "job_salary_benchmark-title-1",
      "name": "Title primary",
      "category": "title",
      "tags": [
        "jobs",
        "career",
        "salary"
      ],
      "cost": 20,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "job_salary_benchmark-location-2",
      "name": "Location primary",
      "category": "location",
      "tags": [
        "jobs",
        "career",
        "salary"
      ],
      "cost": 35,
      "quantity": 7,
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
| `inventory_job_salary_benchmark` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_job_salary_benchmark_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_job_salary_benchmark_coverage` | Show category coverage ratios and unknown categories. |
| `flag_job_salary_benchmark_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_job_salary_benchmark_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_job_salary_benchmark_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_job_salary_benchmark_baseline` | Compare category counts with the configured baseline. |
| `estimate_job_salary_benchmark_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_job_salary_benchmark_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_job_salary_benchmark_dependencies` | Map dependency groups and show which ones are missing. |
| `test_job_salary_benchmark_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_job_salary_benchmark_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_job_salary_benchmark_fixes` | Rank fixes by impact divided by effort. |
| `validate_job_salary_benchmark_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_job_salary_benchmark_duplicates` | Group items with the same category and normalized name. |
| `measure_job_salary_benchmark_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_job_salary_benchmark_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_job_salary_benchmark_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_job_salary_benchmark_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_job_salary_benchmark_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_job_salary_benchmark_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_job_salary_benchmark_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_job_salary_benchmark_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_job_salary_benchmark_next_steps` | Recommend the next five actions with quick wins. |
| `open_job_salary_benchmark_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
