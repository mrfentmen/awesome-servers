# Outlet Safety Audit

Audit outlets, GFCIs, surge protection and cords for safety severity and coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/home-diy-outlet-safety-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "home-diy-outlet-safety-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/home-diy-outlet-safety-check-mcp"]
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
      "id": "outlet-kitchen",
      "name": "Kitchen counter outlet",
      "category": "outlet",
      "tags": [
        "clean"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "outlet-bath-gfci",
      "name": "Bathroom GFCI",
      "category": "gfci",
      "tags": [
        "warning"
      ],
      "cost": 25,
      "quantity": 1,
      "condition": "fair"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_outlet_safety` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_outlet_safety_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_outlet_safety_coverage` | Show category coverage ratios and unknown categories. |
| `flag_outlet_safety_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_outlet_safety_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_outlet_safety_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_outlet_safety_baseline` | Compare category counts with the configured baseline. |
| `estimate_outlet_safety_dtc_severity` | Calculate the primary metric for every item with mean and pass count. |
| `find_outlet_safety_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_outlet_safety_dependencies` | Map dependency groups and show which ones are missing. |
| `test_outlet_safety_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_outlet_safety_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_outlet_safety_fixes` | Rank fixes by impact divided by effort. |
| `validate_outlet_safety_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_outlet_safety_duplicates` | Group items with the same category and normalized name. |
| `measure_outlet_safety_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_outlet_safety_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_outlet_safety_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_outlet_safety_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_outlet_safety_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_outlet_safety_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_outlet_safety_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_outlet_safety_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_outlet_safety_next_steps` | Recommend the next five actions with quick wins. |
| `open_outlet_safety_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
