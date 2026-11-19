# Appliance Warranty Recall Board Audit

Appliance Warranty Recall Board Audit: track appliance warranty and recall checks. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/appliance-warranty-recall-board-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "appliance-warranty-recall-board-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/appliance-warranty-recall-board-mcp"]
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
      "id": "appliance_wr-sample-1",
      "name": "Sample kitchen entry",
      "category": "kitchen",
      "tags": [
        "appliance"
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
      "id": "appliance_wr-sample-2",
      "name": "Sample laundry entry",
      "category": "laundry",
      "tags": [
        "appliance"
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
| `inventory_appliance_wr` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_appliance_wr_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_appliance_wr_coverage` | Show category coverage ratios and unknown categories. |
| `flag_appliance_wr_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_appliance_wr_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_appliance_wr_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_appliance_wr_baseline` | Compare category counts with the configured baseline. |
| `estimate_appliance_wr_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_appliance_wr_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_appliance_wr_dependencies` | Map dependency groups and show which ones are missing. |
| `test_appliance_wr_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_appliance_wr_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_appliance_wr_fixes` | Rank fixes by impact divided by effort. |
| `validate_appliance_wr_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_appliance_wr_duplicates` | Group items with the same category and normalized name. |
| `measure_appliance_wr_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_appliance_wr_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_appliance_wr_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_appliance_wr_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_appliance_wr_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_appliance_wr_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_appliance_wr_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_appliance_wr_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_appliance_wr_next_steps` | Recommend the next five actions with quick wins. |
| `open_appliance_wr_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
