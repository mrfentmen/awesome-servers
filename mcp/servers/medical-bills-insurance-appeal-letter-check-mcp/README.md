# Insurance Appeal Letter Audit

Audit insurance appeal letter by denial, evidence, deadline, delivery coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/medical-bills-insurance-appeal-letter-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "medical-bills-insurance-appeal-letter-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/medical-bills-insurance-appeal-letter-check-mcp"]
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
      "id": "medical_bills_insurance_appeal_letter-denial-1",
      "name": "Denial primary",
      "category": "denial",
      "tags": [
        "medical-bills",
        "insurance-claims",
        "healthcare",
        "cleared"
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
      "id": "medical_bills_insurance_appeal_letter-evidence-2",
      "name": "Evidence primary",
      "category": "evidence",
      "tags": [
        "medical-bills",
        "insurance-claims",
        "healthcare",
        "pending"
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
| `inventory_medical_bills_insurance_appeal_letter` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_medical_bills_insurance_appeal_letter_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_medical_bills_insurance_appeal_letter_coverage` | Show category coverage ratios and unknown categories. |
| `flag_medical_bills_insurance_appeal_letter_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_medical_bills_insurance_appeal_letter_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_medical_bills_insurance_appeal_letter_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_medical_bills_insurance_appeal_letter_baseline` | Compare category counts with the configured baseline. |
| `estimate_medical_bills_insurance_appeal_letter_clearance_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_medical_bills_insurance_appeal_letter_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_medical_bills_insurance_appeal_letter_dependencies` | Map dependency groups and show which ones are missing. |
| `test_medical_bills_insurance_appeal_letter_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_medical_bills_insurance_appeal_letter_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_medical_bills_insurance_appeal_letter_fixes` | Rank fixes by impact divided by effort. |
| `validate_medical_bills_insurance_appeal_letter_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_medical_bills_insurance_appeal_letter_duplicates` | Group items with the same category and normalized name. |
| `measure_medical_bills_insurance_appeal_letter_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_medical_bills_insurance_appeal_letter_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_medical_bills_insurance_appeal_letter_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_medical_bills_insurance_appeal_letter_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_medical_bills_insurance_appeal_letter_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_medical_bills_insurance_appeal_letter_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_medical_bills_insurance_appeal_letter_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_medical_bills_insurance_appeal_letter_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_medical_bills_insurance_appeal_letter_next_steps` | Recommend the next five actions with quick wins. |
| `open_medical_bills_insurance_appeal_letter_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
