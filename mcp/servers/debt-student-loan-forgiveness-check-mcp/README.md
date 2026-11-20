# Student Loan Forgiveness Audit

Audit student loan forgiveness by loan, program, payment, application coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/debt-student-loan-forgiveness-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "debt-student-loan-forgiveness-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/debt-student-loan-forgiveness-check-mcp"]
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
      "id": "debt_student_loan_forgiveness-loan-1",
      "name": "Loan primary",
      "category": "loan",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
      "id": "debt_student_loan_forgiveness-program-2",
      "name": "Program primary",
      "category": "program",
      "tags": [
        "debt",
        "bankruptcy",
        "credit"
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
| `inventory_debt_student_loan_forgiveness` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_debt_student_loan_forgiveness_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_debt_student_loan_forgiveness_coverage` | Show category coverage ratios and unknown categories. |
| `flag_debt_student_loan_forgiveness_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_debt_student_loan_forgiveness_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_debt_student_loan_forgiveness_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_debt_student_loan_forgiveness_baseline` | Compare category counts with the configured baseline. |
| `estimate_debt_student_loan_forgiveness_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_debt_student_loan_forgiveness_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_debt_student_loan_forgiveness_dependencies` | Map dependency groups and show which ones are missing. |
| `test_debt_student_loan_forgiveness_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_debt_student_loan_forgiveness_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_debt_student_loan_forgiveness_fixes` | Rank fixes by impact divided by effort. |
| `validate_debt_student_loan_forgiveness_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_debt_student_loan_forgiveness_duplicates` | Group items with the same category and normalized name. |
| `measure_debt_student_loan_forgiveness_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_debt_student_loan_forgiveness_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_debt_student_loan_forgiveness_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_debt_student_loan_forgiveness_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_debt_student_loan_forgiveness_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_debt_student_loan_forgiveness_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_debt_student_loan_forgiveness_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_debt_student_loan_forgiveness_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_debt_student_loan_forgiveness_next_steps` | Recommend the next five actions with quick wins. |
| `open_debt_student_loan_forgiveness_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
