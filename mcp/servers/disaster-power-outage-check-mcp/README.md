# Power Outage Audit

Audit lights, battery banks, communications and food for a power outage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/disaster-power-outage-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "disaster-power-outage-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/disaster-power-outage-check-mcp"]
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
      "id": "outage-lamp",
      "name": "Rechargeable lamp",
      "category": "light",
      "tags": [
        "led"
      ],
      "cost": 25,
      "quantity": 100,
      "acquired": "2026-01-01",
      "condition": "new"
    },
    {
      "id": "outage-headlamp",
      "name": "Headlamp",
      "category": "light",
      "tags": [
        "led"
      ],
      "cost": 20,
      "quantity": 85,
      "acquired": "2026-02-01",
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_power_outage` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_power_outage_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_power_outage_coverage` | Show category coverage ratios and unknown categories. |
| `flag_power_outage_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_power_outage_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_power_outage_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_power_outage_baseline` | Compare category counts with the configured baseline. |
| `estimate_power_outage_battery_health` | Calculate the primary metric for every item with mean and pass count. |
| `find_power_outage_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_power_outage_dependencies` | Map dependency groups and show which ones are missing. |
| `test_power_outage_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_power_outage_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_power_outage_fixes` | Rank fixes by impact divided by effort. |
| `validate_power_outage_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_power_outage_duplicates` | Group items with the same category and normalized name. |
| `measure_power_outage_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_power_outage_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_power_outage_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_power_outage_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_power_outage_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_power_outage_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_power_outage_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_power_outage_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_power_outage_next_steps` | Recommend the next five actions with quick wins. |
| `open_power_outage_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
