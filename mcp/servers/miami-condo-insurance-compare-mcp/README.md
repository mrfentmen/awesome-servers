# Condo Insurance Compare

Real local JSON analysis of condo insurance in the Miami lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/miami-condo-insurance-compare-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "miami-condo-insurance-compare-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/miami-condo-insurance-compare-mcp"]
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
      "id": "miami_miami_condo_insurance_compare-options-1",
      "name": "Options primary",
      "category": "options",
      "tags": [
        "miami",
        "miami",
        "condo"
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
      "id": "miami_miami_condo_insurance_compare-prices-2",
      "name": "Prices primary",
      "category": "prices",
      "tags": [
        "miami",
        "miami",
        "condo"
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
| `inventory_miami_miami_condo_insurance_compare` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_miami_miami_condo_insurance_compare_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_miami_miami_condo_insurance_compare_coverage` | Show category coverage ratios and unknown categories. |
| `flag_miami_miami_condo_insurance_compare_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_miami_miami_condo_insurance_compare_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_miami_miami_condo_insurance_compare_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_miami_miami_condo_insurance_compare_baseline` | Compare category counts with the configured baseline. |
| `estimate_miami_miami_condo_insurance_compare_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_miami_miami_condo_insurance_compare_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_miami_miami_condo_insurance_compare_dependencies` | Map dependency groups and show which ones are missing. |
| `test_miami_miami_condo_insurance_compare_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_miami_miami_condo_insurance_compare_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_miami_miami_condo_insurance_compare_fixes` | Rank fixes by impact divided by effort. |
| `validate_miami_miami_condo_insurance_compare_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_miami_miami_condo_insurance_compare_duplicates` | Group items with the same category and normalized name. |
| `measure_miami_miami_condo_insurance_compare_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_miami_miami_condo_insurance_compare_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_miami_miami_condo_insurance_compare_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_miami_miami_condo_insurance_compare_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_miami_miami_condo_insurance_compare_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_miami_miami_condo_insurance_compare_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_miami_miami_condo_insurance_compare_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_miami_miami_condo_insurance_compare_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_miami_miami_condo_insurance_compare_next_steps` | Recommend the next five actions with quick wins. |
| `open_miami_miami_condo_insurance_compare_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
