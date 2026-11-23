# Gutter Heat Cable Simulator

Real local JSON analysis of gutter heat cable in the Gutter Heat lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/gutter-heat-cable-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "gutter-heat-cable-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/gutter-heat-cable-mcp"]
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
      "id": "gutter_heat_gutter_heat_cable-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "gutter-heat",
        "gutter",
        "heat"
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
      "id": "gutter_heat_gutter_heat_cable-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "gutter-heat",
        "gutter",
        "heat"
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
| `inventory_gutter_heat_gutter_heat_cable` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_gutter_heat_gutter_heat_cable_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_gutter_heat_gutter_heat_cable_coverage` | Show category coverage ratios and unknown categories. |
| `flag_gutter_heat_gutter_heat_cable_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_gutter_heat_gutter_heat_cable_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_gutter_heat_gutter_heat_cable_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_gutter_heat_gutter_heat_cable_baseline` | Compare category counts with the configured baseline. |
| `estimate_gutter_heat_gutter_heat_cable_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_gutter_heat_gutter_heat_cable_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_gutter_heat_gutter_heat_cable_dependencies` | Map dependency groups and show which ones are missing. |
| `test_gutter_heat_gutter_heat_cable_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_gutter_heat_gutter_heat_cable_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_gutter_heat_gutter_heat_cable_fixes` | Rank fixes by impact divided by effort. |
| `validate_gutter_heat_gutter_heat_cable_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_gutter_heat_gutter_heat_cable_duplicates` | Group items with the same category and normalized name. |
| `measure_gutter_heat_gutter_heat_cable_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_gutter_heat_gutter_heat_cable_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_gutter_heat_gutter_heat_cable_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_gutter_heat_gutter_heat_cable_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_gutter_heat_gutter_heat_cable_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_gutter_heat_gutter_heat_cable_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_gutter_heat_gutter_heat_cable_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_gutter_heat_gutter_heat_cable_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_gutter_heat_gutter_heat_cable_next_steps` | Recommend the next five actions with quick wins. |
| `open_gutter_heat_gutter_heat_cable_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
