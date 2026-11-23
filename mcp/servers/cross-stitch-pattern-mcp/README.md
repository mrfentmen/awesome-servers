# Cross Stitch Pattern Compare

Real local JSON analysis of cross stitch pattern in the Cross Stitch lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/cross-stitch-pattern-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "cross-stitch-pattern-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/cross-stitch-pattern-mcp"]
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
      "id": "cross_stitch_cross_stitch_pattern-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "cross-stitch",
        "cross",
        "stitch"
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
      "id": "cross_stitch_cross_stitch_pattern-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "cross-stitch",
        "cross",
        "stitch"
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
| `inventory_cross_stitch_cross_stitch_pattern` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_cross_stitch_cross_stitch_pattern_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_cross_stitch_cross_stitch_pattern_coverage` | Show category coverage ratios and unknown categories. |
| `flag_cross_stitch_cross_stitch_pattern_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_cross_stitch_cross_stitch_pattern_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_cross_stitch_cross_stitch_pattern_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_cross_stitch_cross_stitch_pattern_baseline` | Compare category counts with the configured baseline. |
| `estimate_cross_stitch_cross_stitch_pattern_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_cross_stitch_cross_stitch_pattern_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_cross_stitch_cross_stitch_pattern_dependencies` | Map dependency groups and show which ones are missing. |
| `test_cross_stitch_cross_stitch_pattern_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_cross_stitch_cross_stitch_pattern_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_cross_stitch_cross_stitch_pattern_fixes` | Rank fixes by impact divided by effort. |
| `validate_cross_stitch_cross_stitch_pattern_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_cross_stitch_cross_stitch_pattern_duplicates` | Group items with the same category and normalized name. |
| `measure_cross_stitch_cross_stitch_pattern_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_cross_stitch_cross_stitch_pattern_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_cross_stitch_cross_stitch_pattern_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_cross_stitch_cross_stitch_pattern_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_cross_stitch_cross_stitch_pattern_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_cross_stitch_cross_stitch_pattern_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_cross_stitch_cross_stitch_pattern_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_cross_stitch_cross_stitch_pattern_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_cross_stitch_cross_stitch_pattern_next_steps` | Recommend the next five actions with quick wins. |
| `open_cross_stitch_cross_stitch_pattern_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
