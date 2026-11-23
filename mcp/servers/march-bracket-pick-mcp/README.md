# March Bracket Pick Tracker

Real local JSON analysis of march bracket pick in the Bracket Season lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/march-bracket-pick-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "march-bracket-pick-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/march-bracket-pick-mcp"]
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
      "id": "bracket_season_march_bracket_pick-models-1",
      "name": "Models primary",
      "category": "models",
      "tags": [
        "bracket-season",
        "march",
        "bracket"
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
      "id": "bracket_season_march_bracket_pick-prices-2",
      "name": "Prices primary",
      "category": "prices",
      "tags": [
        "bracket-season",
        "march",
        "bracket"
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
| `inventory_bracket_season_march_bracket_pick` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_bracket_season_march_bracket_pick_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_bracket_season_march_bracket_pick_coverage` | Show category coverage ratios and unknown categories. |
| `flag_bracket_season_march_bracket_pick_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_bracket_season_march_bracket_pick_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_bracket_season_march_bracket_pick_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_bracket_season_march_bracket_pick_baseline` | Compare category counts with the configured baseline. |
| `estimate_bracket_season_march_bracket_pick_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_bracket_season_march_bracket_pick_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_bracket_season_march_bracket_pick_dependencies` | Map dependency groups and show which ones are missing. |
| `test_bracket_season_march_bracket_pick_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_bracket_season_march_bracket_pick_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_bracket_season_march_bracket_pick_fixes` | Rank fixes by impact divided by effort. |
| `validate_bracket_season_march_bracket_pick_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_bracket_season_march_bracket_pick_duplicates` | Group items with the same category and normalized name. |
| `measure_bracket_season_march_bracket_pick_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_bracket_season_march_bracket_pick_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_bracket_season_march_bracket_pick_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_bracket_season_march_bracket_pick_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_bracket_season_march_bracket_pick_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_bracket_season_march_bracket_pick_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_bracket_season_march_bracket_pick_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_bracket_season_march_bracket_pick_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_bracket_season_march_bracket_pick_next_steps` | Recommend the next five actions with quick wins. |
| `open_bracket_season_march_bracket_pick_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
