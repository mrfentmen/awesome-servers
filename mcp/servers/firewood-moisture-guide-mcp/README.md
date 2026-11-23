# Firewood Moisture Guide Matcher

Real local JSON analysis of firewood moisture guide in the Firewood Moisture lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/firewood-moisture-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "firewood-moisture-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/firewood-moisture-guide-mcp"]
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
      "id": "firewood_moisture_firewood_moisture_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "firewood-moisture",
        "firewood",
        "moisture"
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
      "id": "firewood_moisture_firewood_moisture_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "firewood-moisture",
        "firewood",
        "moisture"
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
| `inventory_firewood_moisture_firewood_moisture_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_firewood_moisture_firewood_moisture_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_firewood_moisture_firewood_moisture_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_firewood_moisture_firewood_moisture_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_firewood_moisture_firewood_moisture_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_firewood_moisture_firewood_moisture_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_firewood_moisture_firewood_moisture_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_firewood_moisture_firewood_moisture_guide_clearance_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_firewood_moisture_firewood_moisture_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_firewood_moisture_firewood_moisture_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_firewood_moisture_firewood_moisture_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_firewood_moisture_firewood_moisture_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_firewood_moisture_firewood_moisture_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_firewood_moisture_firewood_moisture_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_firewood_moisture_firewood_moisture_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_firewood_moisture_firewood_moisture_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_firewood_moisture_firewood_moisture_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_firewood_moisture_firewood_moisture_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_firewood_moisture_firewood_moisture_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_firewood_moisture_firewood_moisture_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_firewood_moisture_firewood_moisture_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_firewood_moisture_firewood_moisture_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_firewood_moisture_firewood_moisture_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_firewood_moisture_firewood_moisture_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_firewood_moisture_firewood_moisture_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
