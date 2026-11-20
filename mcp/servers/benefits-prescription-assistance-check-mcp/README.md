# Prescription Assistance Audit

Audit prescription assistance by drug, income, program, renewal coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/benefits-prescription-assistance-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "benefits-prescription-assistance-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/benefits-prescription-assistance-check-mcp"]
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
      "id": "benefits_prescription_assistance-drug-1",
      "name": "Drug primary",
      "category": "drug",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_prescription_assistance-income-2",
      "name": "Income primary",
      "category": "income",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
| `inventory_benefits_prescription_assistance` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_benefits_prescription_assistance_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_benefits_prescription_assistance_coverage` | Show category coverage ratios and unknown categories. |
| `flag_benefits_prescription_assistance_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_benefits_prescription_assistance_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_benefits_prescription_assistance_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_benefits_prescription_assistance_baseline` | Compare category counts with the configured baseline. |
| `estimate_benefits_prescription_assistance_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_benefits_prescription_assistance_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_benefits_prescription_assistance_dependencies` | Map dependency groups and show which ones are missing. |
| `test_benefits_prescription_assistance_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_benefits_prescription_assistance_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_benefits_prescription_assistance_fixes` | Rank fixes by impact divided by effort. |
| `validate_benefits_prescription_assistance_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_benefits_prescription_assistance_duplicates` | Group items with the same category and normalized name. |
| `measure_benefits_prescription_assistance_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_benefits_prescription_assistance_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_benefits_prescription_assistance_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_benefits_prescription_assistance_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_benefits_prescription_assistance_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_benefits_prescription_assistance_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_benefits_prescription_assistance_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_benefits_prescription_assistance_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_benefits_prescription_assistance_next_steps` | Recommend the next five actions with quick wins. |
| `open_benefits_prescription_assistance_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
