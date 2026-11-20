# Scholarship Fit Audit

Audit scholarship fit by eligibility, essay, deadline, amount coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/college-scholarship-fit-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "college-scholarship-fit-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/college-scholarship-fit-check-mcp"]
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
      "id": "college_scholarship_fit-eligibility-1",
      "name": "Eligibility primary",
      "category": "eligibility",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
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
      "id": "college_scholarship_fit-essay-2",
      "name": "Essay primary",
      "category": "essay",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
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
| `inventory_college_scholarship_fit` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_college_scholarship_fit_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_college_scholarship_fit_coverage` | Show category coverage ratios and unknown categories. |
| `flag_college_scholarship_fit_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_college_scholarship_fit_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_college_scholarship_fit_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_college_scholarship_fit_baseline` | Compare category counts with the configured baseline. |
| `estimate_college_scholarship_fit_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_college_scholarship_fit_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_college_scholarship_fit_dependencies` | Map dependency groups and show which ones are missing. |
| `test_college_scholarship_fit_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_college_scholarship_fit_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_college_scholarship_fit_fixes` | Rank fixes by impact divided by effort. |
| `validate_college_scholarship_fit_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_college_scholarship_fit_duplicates` | Group items with the same category and normalized name. |
| `measure_college_scholarship_fit_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_college_scholarship_fit_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_college_scholarship_fit_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_college_scholarship_fit_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_college_scholarship_fit_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_college_scholarship_fit_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_college_scholarship_fit_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_college_scholarship_fit_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_college_scholarship_fit_next_steps` | Recommend the next five actions with quick wins. |
| `open_college_scholarship_fit_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
