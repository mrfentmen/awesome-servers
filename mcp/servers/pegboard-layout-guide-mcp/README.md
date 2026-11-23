# Pegboard Layout Guide Archive

Real local JSON analysis of pegboard layout guide in the Pegboard Layout lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/pegboard-layout-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "pegboard-layout-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/pegboard-layout-guide-mcp"]
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
      "id": "pegboard_layout_pegboard_layout_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "pegboard-layout",
        "pegboard",
        "layout"
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
      "id": "pegboard_layout_pegboard_layout_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "pegboard-layout",
        "pegboard",
        "layout"
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
| `inventory_pegboard_layout_pegboard_layout_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_pegboard_layout_pegboard_layout_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_pegboard_layout_pegboard_layout_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_pegboard_layout_pegboard_layout_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_pegboard_layout_pegboard_layout_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_pegboard_layout_pegboard_layout_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_pegboard_layout_pegboard_layout_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_pegboard_layout_pegboard_layout_guide_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_pegboard_layout_pegboard_layout_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_pegboard_layout_pegboard_layout_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_pegboard_layout_pegboard_layout_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_pegboard_layout_pegboard_layout_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_pegboard_layout_pegboard_layout_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_pegboard_layout_pegboard_layout_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_pegboard_layout_pegboard_layout_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_pegboard_layout_pegboard_layout_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_pegboard_layout_pegboard_layout_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_pegboard_layout_pegboard_layout_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_pegboard_layout_pegboard_layout_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_pegboard_layout_pegboard_layout_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_pegboard_layout_pegboard_layout_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_pegboard_layout_pegboard_layout_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_pegboard_layout_pegboard_layout_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_pegboard_layout_pegboard_layout_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_pegboard_layout_pegboard_layout_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
