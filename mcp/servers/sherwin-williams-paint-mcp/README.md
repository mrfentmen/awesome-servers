# Sherwin Williams Paint Tracker

Real local JSON analysis of sherwin williams paint in the Sherwin Williams lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/sherwin-williams-paint-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "sherwin-williams-paint-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/sherwin-williams-paint-mcp"]
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
      "id": "sherwin_williams_sherwin_williams_paint-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "sherwin-williams",
        "sherwin",
        "williams"
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
      "id": "sherwin_williams_sherwin_williams_paint-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "sherwin-williams",
        "sherwin",
        "williams"
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
| `inventory_sherwin_williams_sherwin_williams_paint` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_sherwin_williams_sherwin_williams_paint_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_sherwin_williams_sherwin_williams_paint_coverage` | Show category coverage ratios and unknown categories. |
| `flag_sherwin_williams_sherwin_williams_paint_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_sherwin_williams_sherwin_williams_paint_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_sherwin_williams_sherwin_williams_paint_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_sherwin_williams_sherwin_williams_paint_baseline` | Compare category counts with the configured baseline. |
| `estimate_sherwin_williams_sherwin_williams_paint_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_sherwin_williams_sherwin_williams_paint_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_sherwin_williams_sherwin_williams_paint_dependencies` | Map dependency groups and show which ones are missing. |
| `test_sherwin_williams_sherwin_williams_paint_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_sherwin_williams_sherwin_williams_paint_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_sherwin_williams_sherwin_williams_paint_fixes` | Rank fixes by impact divided by effort. |
| `validate_sherwin_williams_sherwin_williams_paint_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_sherwin_williams_sherwin_williams_paint_duplicates` | Group items with the same category and normalized name. |
| `measure_sherwin_williams_sherwin_williams_paint_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_sherwin_williams_sherwin_williams_paint_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_sherwin_williams_sherwin_williams_paint_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_sherwin_williams_sherwin_williams_paint_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_sherwin_williams_sherwin_williams_paint_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_sherwin_williams_sherwin_williams_paint_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_sherwin_williams_sherwin_williams_paint_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_sherwin_williams_sherwin_williams_paint_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_sherwin_williams_sherwin_williams_paint_next_steps` | Recommend the next five actions with quick wins. |
| `open_sherwin_williams_sherwin_williams_paint_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
