# Vendor Risk Audit

Audit vendor risk by contract, security, insurance, backup coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/small-business-vendor-risk-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "small-business-vendor-risk-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/small-business-vendor-risk-check-mcp"]
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
      "id": "small_business_vendor_risk-contract-1",
      "name": "Contract primary",
      "category": "contract",
      "tags": [
        "small-business",
        "compliance",
        "operations"
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
      "id": "small_business_vendor_risk-security-2",
      "name": "Security primary",
      "category": "security",
      "tags": [
        "small-business",
        "compliance",
        "operations"
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
| `inventory_small_business_vendor_risk` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_small_business_vendor_risk_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_small_business_vendor_risk_coverage` | Show category coverage ratios and unknown categories. |
| `flag_small_business_vendor_risk_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_small_business_vendor_risk_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_small_business_vendor_risk_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_small_business_vendor_risk_baseline` | Compare category counts with the configured baseline. |
| `estimate_small_business_vendor_risk_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_small_business_vendor_risk_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_small_business_vendor_risk_dependencies` | Map dependency groups and show which ones are missing. |
| `test_small_business_vendor_risk_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_small_business_vendor_risk_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_small_business_vendor_risk_fixes` | Rank fixes by impact divided by effort. |
| `validate_small_business_vendor_risk_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_small_business_vendor_risk_duplicates` | Group items with the same category and normalized name. |
| `measure_small_business_vendor_risk_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_small_business_vendor_risk_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_small_business_vendor_risk_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_small_business_vendor_risk_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_small_business_vendor_risk_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_small_business_vendor_risk_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_small_business_vendor_risk_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_small_business_vendor_risk_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_small_business_vendor_risk_next_steps` | Recommend the next five actions with quick wins. |
| `open_small_business_vendor_risk_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
