# Prescription Refill Audit

Audit prescription refill by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/petco-prescription-refill-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "petco-prescription-refill-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/petco-prescription-refill-check-mcp"]
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
      "id": "prescription_refill-heartworm",
      "name": "Heartworm chew",
      "category": "medication",
      "tags": [
        "monthly",
        "vet"
      ],
      "cost": 35,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "prescription_refill-kidney",
      "name": "Kidney diet",
      "category": "food",
      "tags": [
        "prescription",
        "wet"
      ],
      "cost": 55,
      "quantity": 12,
      "condition": "fair"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_prescription_refill` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_prescription_refill_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_prescription_refill_coverage` | Show category coverage ratios and unknown categories. |
| `flag_prescription_refill_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_prescription_refill_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_prescription_refill_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_prescription_refill_baseline` | Compare category counts with the configured baseline. |
| `estimate_prescription_refill_days_supply` | Calculate the primary metric for every item with mean and pass count. |
| `find_prescription_refill_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_prescription_refill_dependencies` | Map dependency groups and show which ones are missing. |
| `test_prescription_refill_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_prescription_refill_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_prescription_refill_fixes` | Rank fixes by impact divided by effort. |
| `validate_prescription_refill_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_prescription_refill_duplicates` | Group items with the same category and normalized name. |
| `measure_prescription_refill_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_prescription_refill_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_prescription_refill_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_prescription_refill_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_prescription_refill_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_prescription_refill_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_prescription_refill_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_prescription_refill_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_prescription_refill_next_steps` | Recommend the next five actions with quick wins. |
| `open_prescription_refill_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
