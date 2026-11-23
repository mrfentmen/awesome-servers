# Cupping Score Sheet Audit

Real local JSON analysis of cupping score sheet in the Brew Bar lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/cupping-score-sheet-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "cupping-score-sheet-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/cupping-score-sheet-mcp"]
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
      "id": "brew_bar_cupping_score_sheet-steps-1",
      "name": "Steps primary",
      "category": "steps",
      "tags": [
        "brew-bar",
        "cupping",
        "score"
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
      "id": "brew_bar_cupping_score_sheet-tools-2",
      "name": "Tools primary",
      "category": "tools",
      "tags": [
        "brew-bar",
        "cupping",
        "score"
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
| `inventory_brew_bar_cupping_score_sheet` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_brew_bar_cupping_score_sheet_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_brew_bar_cupping_score_sheet_coverage` | Show category coverage ratios and unknown categories. |
| `flag_brew_bar_cupping_score_sheet_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_brew_bar_cupping_score_sheet_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_brew_bar_cupping_score_sheet_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_brew_bar_cupping_score_sheet_baseline` | Compare category counts with the configured baseline. |
| `estimate_brew_bar_cupping_score_sheet_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_brew_bar_cupping_score_sheet_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_brew_bar_cupping_score_sheet_dependencies` | Map dependency groups and show which ones are missing. |
| `test_brew_bar_cupping_score_sheet_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_brew_bar_cupping_score_sheet_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_brew_bar_cupping_score_sheet_fixes` | Rank fixes by impact divided by effort. |
| `validate_brew_bar_cupping_score_sheet_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_brew_bar_cupping_score_sheet_duplicates` | Group items with the same category and normalized name. |
| `measure_brew_bar_cupping_score_sheet_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_brew_bar_cupping_score_sheet_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_brew_bar_cupping_score_sheet_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_brew_bar_cupping_score_sheet_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_brew_bar_cupping_score_sheet_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_brew_bar_cupping_score_sheet_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_brew_bar_cupping_score_sheet_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_brew_bar_cupping_score_sheet_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_brew_bar_cupping_score_sheet_next_steps` | Recommend the next five actions with quick wins. |
| `open_brew_bar_cupping_score_sheet_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
