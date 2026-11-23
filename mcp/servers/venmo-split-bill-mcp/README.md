# Venmo Split Bill Tracker

Real local JSON analysis of venmo split bill in the Venmo Split lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/venmo-split-bill-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "venmo-split-bill-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/venmo-split-bill-mcp"]
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
      "id": "venmo_split_venmo_split_bill-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "venmo-split",
        "venmo",
        "split"
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
      "id": "venmo_split_venmo_split_bill-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "venmo-split",
        "venmo",
        "split"
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
| `inventory_venmo_split_venmo_split_bill` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_venmo_split_venmo_split_bill_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_venmo_split_venmo_split_bill_coverage` | Show category coverage ratios and unknown categories. |
| `flag_venmo_split_venmo_split_bill_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_venmo_split_venmo_split_bill_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_venmo_split_venmo_split_bill_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_venmo_split_venmo_split_bill_baseline` | Compare category counts with the configured baseline. |
| `estimate_venmo_split_venmo_split_bill_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_venmo_split_venmo_split_bill_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_venmo_split_venmo_split_bill_dependencies` | Map dependency groups and show which ones are missing. |
| `test_venmo_split_venmo_split_bill_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_venmo_split_venmo_split_bill_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_venmo_split_venmo_split_bill_fixes` | Rank fixes by impact divided by effort. |
| `validate_venmo_split_venmo_split_bill_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_venmo_split_venmo_split_bill_duplicates` | Group items with the same category and normalized name. |
| `measure_venmo_split_venmo_split_bill_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_venmo_split_venmo_split_bill_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_venmo_split_venmo_split_bill_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_venmo_split_venmo_split_bill_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_venmo_split_venmo_split_bill_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_venmo_split_venmo_split_bill_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_venmo_split_venmo_split_bill_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_venmo_split_venmo_split_bill_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_venmo_split_venmo_split_bill_next_steps` | Recommend the next five actions with quick wins. |
| `open_venmo_split_venmo_split_bill_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
