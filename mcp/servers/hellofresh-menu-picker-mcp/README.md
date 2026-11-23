# Hellofresh Menu Picker Tracker

Real local JSON analysis of hellofresh menu picker in the Hellofresh Menu lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/hellofresh-menu-picker-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "hellofresh-menu-picker-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/hellofresh-menu-picker-mcp"]
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
      "id": "hellofresh_menu_hellofresh_menu_picker-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "hellofresh-menu",
        "hellofresh",
        "menu"
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
      "id": "hellofresh_menu_hellofresh_menu_picker-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "hellofresh-menu",
        "hellofresh",
        "menu"
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
| `inventory_hellofresh_menu_hellofresh_menu_picker` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_hellofresh_menu_hellofresh_menu_picker_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_hellofresh_menu_hellofresh_menu_picker_coverage` | Show category coverage ratios and unknown categories. |
| `flag_hellofresh_menu_hellofresh_menu_picker_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_hellofresh_menu_hellofresh_menu_picker_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_hellofresh_menu_hellofresh_menu_picker_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_hellofresh_menu_hellofresh_menu_picker_baseline` | Compare category counts with the configured baseline. |
| `estimate_hellofresh_menu_hellofresh_menu_picker_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_hellofresh_menu_hellofresh_menu_picker_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_hellofresh_menu_hellofresh_menu_picker_dependencies` | Map dependency groups and show which ones are missing. |
| `test_hellofresh_menu_hellofresh_menu_picker_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_hellofresh_menu_hellofresh_menu_picker_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_hellofresh_menu_hellofresh_menu_picker_fixes` | Rank fixes by impact divided by effort. |
| `validate_hellofresh_menu_hellofresh_menu_picker_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_hellofresh_menu_hellofresh_menu_picker_duplicates` | Group items with the same category and normalized name. |
| `measure_hellofresh_menu_hellofresh_menu_picker_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_hellofresh_menu_hellofresh_menu_picker_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_hellofresh_menu_hellofresh_menu_picker_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_hellofresh_menu_hellofresh_menu_picker_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_hellofresh_menu_hellofresh_menu_picker_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_hellofresh_menu_hellofresh_menu_picker_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_hellofresh_menu_hellofresh_menu_picker_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_hellofresh_menu_hellofresh_menu_picker_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_hellofresh_menu_hellofresh_menu_picker_next_steps` | Recommend the next five actions with quick wins. |
| `open_hellofresh_menu_hellofresh_menu_picker_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
