# Makeup Expiry Audit

Track makeup expiry dates, days remaining, category coverage and replacement risk. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/makeup-makeup-expiry-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "makeup-makeup-expiry-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/makeup-makeup-expiry-check-mcp"]
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
      "id": "makeup-foundation",
      "name": "Liquid foundation",
      "category": "base",
      "tags": [
        "liquid"
      ],
      "cost": 45,
      "quantity": 1,
      "acquired": "2026-01-01",
      "expires": "2027-06-01",
      "condition": "good"
    },
    {
      "id": "makeup-mascara",
      "name": "Volumizing mascara",
      "category": "eye",
      "tags": [
        "black"
      ],
      "cost": 25,
      "quantity": 1,
      "acquired": "2026-02-01",
      "expires": "2027-01-01",
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_makeup_expiry` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_makeup_expiry_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_makeup_expiry_coverage` | Show category coverage ratios and unknown categories. |
| `flag_makeup_expiry_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_makeup_expiry_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_makeup_expiry_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_makeup_expiry_baseline` | Compare category counts with the configured baseline. |
| `estimate_makeup_expiry_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_makeup_expiry_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_makeup_expiry_dependencies` | Map dependency groups and show which ones are missing. |
| `test_makeup_expiry_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_makeup_expiry_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_makeup_expiry_fixes` | Rank fixes by impact divided by effort. |
| `validate_makeup_expiry_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_makeup_expiry_duplicates` | Group items with the same category and normalized name. |
| `measure_makeup_expiry_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_makeup_expiry_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_makeup_expiry_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_makeup_expiry_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_makeup_expiry_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_makeup_expiry_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_makeup_expiry_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_makeup_expiry_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_makeup_expiry_next_steps` | Recommend the next five actions with quick wins. |
| `open_makeup_expiry_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
