# Side Job Pay Tracker Audit

Side Job Pay Tracker Audit: odd job cash log and rates. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/side-job-pay-tracker-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "side-job-pay-tracker-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/side-job-pay-tracker-mcp"]
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
      "id": "side_job-sample-1",
      "name": "Sample yard entry",
      "category": "yard",
      "tags": [
        "side-job"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "side_job-sample-2",
      "name": "Sample cleaning entry",
      "category": "clean",
      "tags": [
        "side-job"
      ],
      "cost": 30,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_side_job` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_side_job_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_side_job_coverage` | Show category coverage ratios and unknown categories. |
| `flag_side_job_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_side_job_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_side_job_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_side_job_baseline` | Compare category counts with the configured baseline. |
| `estimate_side_job_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_side_job_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_side_job_dependencies` | Map dependency groups and show which ones are missing. |
| `test_side_job_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_side_job_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_side_job_fixes` | Rank fixes by impact divided by effort. |
| `validate_side_job_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_side_job_duplicates` | Group items with the same category and normalized name. |
| `measure_side_job_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_side_job_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_side_job_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_side_job_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_side_job_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_side_job_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_side_job_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_side_job_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_side_job_next_steps` | Recommend the next five actions with quick wins. |
| `open_side_job_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
