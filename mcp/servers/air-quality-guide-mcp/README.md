# air quality guide Guide

Real local JSON analysis of air quality guide in the Energy & Planet lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/air-quality-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "air-quality-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/air-quality-guide-mcp"]
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
      "id": "planet_air_quality_guide-planet-1",
      "name": "planet primary",
      "category": "planet",
      "tags": [
        "energy-planet",
        "air",
        "quality"
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
      "id": "planet_air_quality_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "energy-planet",
        "air",
        "quality"
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
| `inventory_planet_air_quality_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_planet_air_quality_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_planet_air_quality_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_planet_air_quality_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_planet_air_quality_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_planet_air_quality_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_planet_air_quality_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_planet_air_quality_guide_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_planet_air_quality_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_planet_air_quality_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_planet_air_quality_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_planet_air_quality_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_planet_air_quality_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_planet_air_quality_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_planet_air_quality_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_planet_air_quality_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_planet_air_quality_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_planet_air_quality_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_planet_air_quality_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_planet_air_quality_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_planet_air_quality_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_planet_air_quality_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_planet_air_quality_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_planet_air_quality_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_planet_air_quality_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
