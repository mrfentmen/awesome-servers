# Walgreens Prescription Refill Tracker

Real local JSON analysis of walgreens prescription refill in the Walgreens Prescription lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/walgreens-prescription-refill-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "walgreens-prescription-refill-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/walgreens-prescription-refill-mcp"]
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
      "id": "walgreens_prescription_walgreens_prescription_refill-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "walgreens-prescription",
        "walgreens",
        "prescription"
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
      "id": "walgreens_prescription_walgreens_prescription_refill-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "walgreens-prescription",
        "walgreens",
        "prescription"
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
| `inventory_walgreens_prescription_walgreens_prescription_refill` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_walgreens_prescription_walgreens_prescription_refill_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_walgreens_prescription_walgreens_prescription_refill_coverage` | Show category coverage ratios and unknown categories. |
| `flag_walgreens_prescription_walgreens_prescription_refill_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_walgreens_prescription_walgreens_prescription_refill_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_walgreens_prescription_walgreens_prescription_refill_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_walgreens_prescription_walgreens_prescription_refill_baseline` | Compare category counts with the configured baseline. |
| `estimate_walgreens_prescription_walgreens_prescription_refill_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_walgreens_prescription_walgreens_prescription_refill_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_walgreens_prescription_walgreens_prescription_refill_dependencies` | Map dependency groups and show which ones are missing. |
| `test_walgreens_prescription_walgreens_prescription_refill_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_walgreens_prescription_walgreens_prescription_refill_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_walgreens_prescription_walgreens_prescription_refill_fixes` | Rank fixes by impact divided by effort. |
| `validate_walgreens_prescription_walgreens_prescription_refill_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_walgreens_prescription_walgreens_prescription_refill_duplicates` | Group items with the same category and normalized name. |
| `measure_walgreens_prescription_walgreens_prescription_refill_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_walgreens_prescription_walgreens_prescription_refill_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_walgreens_prescription_walgreens_prescription_refill_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_walgreens_prescription_walgreens_prescription_refill_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_walgreens_prescription_walgreens_prescription_refill_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_walgreens_prescription_walgreens_prescription_refill_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_walgreens_prescription_walgreens_prescription_refill_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_walgreens_prescription_walgreens_prescription_refill_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_walgreens_prescription_walgreens_prescription_refill_next_steps` | Recommend the next five actions with quick wins. |
| `open_walgreens_prescription_walgreens_prescription_refill_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
