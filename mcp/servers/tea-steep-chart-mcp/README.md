# Tea Steep Chart Compare

Real local JSON analysis of tea steep chart in the Brew Bar lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/tea-steep-chart-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "tea-steep-chart-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/tea-steep-chart-mcp"]
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
      "id": "brew_bar_tea_steep_chart-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "brew-bar",
        "tea",
        "steep"
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
      "id": "brew_bar_tea_steep_chart-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "brew-bar",
        "tea",
        "steep"
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
| `inventory_brew_bar_tea_steep_chart` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_brew_bar_tea_steep_chart_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_brew_bar_tea_steep_chart_coverage` | Show category coverage ratios and unknown categories. |
| `flag_brew_bar_tea_steep_chart_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_brew_bar_tea_steep_chart_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_brew_bar_tea_steep_chart_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_brew_bar_tea_steep_chart_baseline` | Compare category counts with the configured baseline. |
| `estimate_brew_bar_tea_steep_chart_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_brew_bar_tea_steep_chart_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_brew_bar_tea_steep_chart_dependencies` | Map dependency groups and show which ones are missing. |
| `test_brew_bar_tea_steep_chart_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_brew_bar_tea_steep_chart_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_brew_bar_tea_steep_chart_fixes` | Rank fixes by impact divided by effort. |
| `validate_brew_bar_tea_steep_chart_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_brew_bar_tea_steep_chart_duplicates` | Group items with the same category and normalized name. |
| `measure_brew_bar_tea_steep_chart_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_brew_bar_tea_steep_chart_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_brew_bar_tea_steep_chart_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_brew_bar_tea_steep_chart_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_brew_bar_tea_steep_chart_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_brew_bar_tea_steep_chart_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_brew_bar_tea_steep_chart_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_brew_bar_tea_steep_chart_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_brew_bar_tea_steep_chart_next_steps` | Recommend the next five actions with quick wins. |
| `open_brew_bar_tea_steep_chart_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
