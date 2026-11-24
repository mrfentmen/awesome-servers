# Trek Pole Length Planner

Real local JSON analysis of trek pole length in the Trail Camp lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/trek-pole-length-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "trek-pole-length-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/trek-pole-length-mcp"]
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
      "id": "trail_camp_trek_pole_length-rows-1",
      "name": "Rows primary",
      "category": "rows",
      "tags": [
        "trail-camp",
        "trek",
        "pole"
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
      "id": "trail_camp_trek_pole_length-flags-2",
      "name": "Flags primary",
      "category": "flags",
      "tags": [
        "trail-camp",
        "trek",
        "pole"
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
| `inventory_trail_camp_trek_pole_length` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_trail_camp_trek_pole_length_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_trail_camp_trek_pole_length_coverage` | Show category coverage ratios and unknown categories. |
| `flag_trail_camp_trek_pole_length_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_trail_camp_trek_pole_length_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_trail_camp_trek_pole_length_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_trail_camp_trek_pole_length_baseline` | Compare category counts with the configured baseline. |
| `estimate_trail_camp_trek_pole_length_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_trail_camp_trek_pole_length_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_trail_camp_trek_pole_length_dependencies` | Map dependency groups and show which ones are missing. |
| `test_trail_camp_trek_pole_length_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_trail_camp_trek_pole_length_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_trail_camp_trek_pole_length_fixes` | Rank fixes by impact divided by effort. |
| `validate_trail_camp_trek_pole_length_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_trail_camp_trek_pole_length_duplicates` | Group items with the same category and normalized name. |
| `measure_trail_camp_trek_pole_length_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_trail_camp_trek_pole_length_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_trail_camp_trek_pole_length_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_trail_camp_trek_pole_length_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_trail_camp_trek_pole_length_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_trail_camp_trek_pole_length_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_trail_camp_trek_pole_length_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_trail_camp_trek_pole_length_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_trail_camp_trek_pole_length_next_steps` | Recommend the next five actions with quick wins. |
| `open_trail_camp_trek_pole_length_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
