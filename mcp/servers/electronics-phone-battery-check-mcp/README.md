# Phone Battery Health Audit

Audit phone, tablet and laptop battery health, replacement risk and accessory coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/electronics-phone-battery-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "electronics-phone-battery-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/electronics-phone-battery-check-mcp"]
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
      "id": "device-phone",
      "name": "Main phone",
      "category": "phone",
      "tags": [
        "daily"
      ],
      "cost": 900,
      "quantity": 92,
      "acquired": "2024-09-01",
      "condition": "good"
    },
    {
      "id": "device-tablet",
      "name": "Drawing tablet",
      "category": "tablet",
      "tags": [
        "creative"
      ],
      "cost": 500,
      "quantity": 78,
      "acquired": "2024-03-01",
      "condition": "fair"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_phone_battery` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_phone_battery_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_phone_battery_coverage` | Show category coverage ratios and unknown categories. |
| `flag_phone_battery_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_phone_battery_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_phone_battery_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_phone_battery_baseline` | Compare category counts with the configured baseline. |
| `estimate_phone_battery_battery_health` | Calculate the primary metric for every item with mean and pass count. |
| `find_phone_battery_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_phone_battery_dependencies` | Map dependency groups and show which ones are missing. |
| `test_phone_battery_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_phone_battery_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_phone_battery_fixes` | Rank fixes by impact divided by effort. |
| `validate_phone_battery_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_phone_battery_duplicates` | Group items with the same category and normalized name. |
| `measure_phone_battery_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_phone_battery_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_phone_battery_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_phone_battery_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_phone_battery_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_phone_battery_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_phone_battery_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_phone_battery_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_phone_battery_next_steps` | Recommend the next five actions with quick wins. |
| `open_phone_battery_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
