# Small Event Vendor Payment Tracker Audit

Small Event Vendor Payment Tracker Audit: track small event deposits and balances. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/small-event-vendor-payment-tracker-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "small-event-vendor-payment-tracker-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/small-event-vendor-payment-tracker-mcp"]
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
      "id": "event_vendor-sample-1",
      "name": "Sample venue entry",
      "category": "venue",
      "tags": [
        "event"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "event_vendor-sample-2",
      "name": "Sample food entry",
      "category": "food",
      "tags": [
        "event"
      ],
      "cost": 30,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_event_vendor` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_event_vendor_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_event_vendor_coverage` | Show category coverage ratios and unknown categories. |
| `flag_event_vendor_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_event_vendor_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_event_vendor_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_event_vendor_baseline` | Compare category counts with the configured baseline. |
| `estimate_event_vendor_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_event_vendor_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_event_vendor_dependencies` | Map dependency groups and show which ones are missing. |
| `test_event_vendor_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_event_vendor_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_event_vendor_fixes` | Rank fixes by impact divided by effort. |
| `validate_event_vendor_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_event_vendor_duplicates` | Group items with the same category and normalized name. |
| `measure_event_vendor_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_event_vendor_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_event_vendor_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_event_vendor_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_event_vendor_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_event_vendor_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_event_vendor_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_event_vendor_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_event_vendor_next_steps` | Recommend the next five actions with quick wins. |
| `open_event_vendor_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
