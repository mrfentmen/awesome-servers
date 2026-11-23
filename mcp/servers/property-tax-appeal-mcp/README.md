# Property Tax Appeal Matcher

Real local JSON analysis of property tax appeal in the Property Tax lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/property-tax-appeal-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "property-tax-appeal-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/property-tax-appeal-mcp"]
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
      "id": "property_tax_property_tax_appeal-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "property-tax",
        "property",
        "tax"
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
      "id": "property_tax_property_tax_appeal-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "property-tax",
        "property",
        "tax"
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
| `inventory_property_tax_property_tax_appeal` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_property_tax_property_tax_appeal_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_property_tax_property_tax_appeal_coverage` | Show category coverage ratios and unknown categories. |
| `flag_property_tax_property_tax_appeal_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_property_tax_property_tax_appeal_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_property_tax_property_tax_appeal_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_property_tax_property_tax_appeal_baseline` | Compare category counts with the configured baseline. |
| `estimate_property_tax_property_tax_appeal_clearance_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_property_tax_property_tax_appeal_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_property_tax_property_tax_appeal_dependencies` | Map dependency groups and show which ones are missing. |
| `test_property_tax_property_tax_appeal_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_property_tax_property_tax_appeal_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_property_tax_property_tax_appeal_fixes` | Rank fixes by impact divided by effort. |
| `validate_property_tax_property_tax_appeal_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_property_tax_property_tax_appeal_duplicates` | Group items with the same category and normalized name. |
| `measure_property_tax_property_tax_appeal_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_property_tax_property_tax_appeal_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_property_tax_property_tax_appeal_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_property_tax_property_tax_appeal_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_property_tax_property_tax_appeal_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_property_tax_property_tax_appeal_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_property_tax_property_tax_appeal_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_property_tax_property_tax_appeal_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_property_tax_property_tax_appeal_next_steps` | Recommend the next five actions with quick wins. |
| `open_property_tax_property_tax_appeal_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
