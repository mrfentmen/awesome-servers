# Memorial Service Plan Audit

Memorial Service Plan Audit: readings music and guestbook plan. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/memorial-service-plan-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "memorial-service-plan-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/memorial-service-plan-mcp"]
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
      "id": "memorial_plan-sample-1",
      "name": "Sample readings entry",
      "category": "readings",
      "tags": [
        "memorial"
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
      "id": "memorial_plan-sample-2",
      "name": "Sample music entry",
      "category": "music",
      "tags": [
        "memorial"
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
| `inventory_memorial_plan` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_memorial_plan_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_memorial_plan_coverage` | Show category coverage ratios and unknown categories. |
| `flag_memorial_plan_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_memorial_plan_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_memorial_plan_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_memorial_plan_baseline` | Compare category counts with the configured baseline. |
| `estimate_memorial_plan_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_memorial_plan_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_memorial_plan_dependencies` | Map dependency groups and show which ones are missing. |
| `test_memorial_plan_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_memorial_plan_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_memorial_plan_fixes` | Rank fixes by impact divided by effort. |
| `validate_memorial_plan_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_memorial_plan_duplicates` | Group items with the same category and normalized name. |
| `measure_memorial_plan_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_memorial_plan_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_memorial_plan_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_memorial_plan_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_memorial_plan_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_memorial_plan_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_memorial_plan_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_memorial_plan_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_memorial_plan_next_steps` | Recommend the next five actions with quick wins. |
| `open_memorial_plan_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
