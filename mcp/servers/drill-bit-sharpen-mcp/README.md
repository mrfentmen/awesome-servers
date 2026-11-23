# Drill Bit Sharpen Planner

Real local JSON analysis of drill bit sharpen in the Drill Bit lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/drill-bit-sharpen-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "drill-bit-sharpen-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/drill-bit-sharpen-mcp"]
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
      "id": "drill_bit_drill_bit_sharpen-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "drill-bit",
        "drill",
        "bit"
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
      "id": "drill_bit_drill_bit_sharpen-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "drill-bit",
        "drill",
        "bit"
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
| `inventory_drill_bit_drill_bit_sharpen` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_drill_bit_drill_bit_sharpen_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_drill_bit_drill_bit_sharpen_coverage` | Show category coverage ratios and unknown categories. |
| `flag_drill_bit_drill_bit_sharpen_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_drill_bit_drill_bit_sharpen_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_drill_bit_drill_bit_sharpen_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_drill_bit_drill_bit_sharpen_baseline` | Compare category counts with the configured baseline. |
| `estimate_drill_bit_drill_bit_sharpen_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_drill_bit_drill_bit_sharpen_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_drill_bit_drill_bit_sharpen_dependencies` | Map dependency groups and show which ones are missing. |
| `test_drill_bit_drill_bit_sharpen_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_drill_bit_drill_bit_sharpen_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_drill_bit_drill_bit_sharpen_fixes` | Rank fixes by impact divided by effort. |
| `validate_drill_bit_drill_bit_sharpen_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_drill_bit_drill_bit_sharpen_duplicates` | Group items with the same category and normalized name. |
| `measure_drill_bit_drill_bit_sharpen_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_drill_bit_drill_bit_sharpen_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_drill_bit_drill_bit_sharpen_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_drill_bit_drill_bit_sharpen_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_drill_bit_drill_bit_sharpen_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_drill_bit_drill_bit_sharpen_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_drill_bit_drill_bit_sharpen_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_drill_bit_drill_bit_sharpen_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_drill_bit_drill_bit_sharpen_next_steps` | Recommend the next five actions with quick wins. |
| `open_drill_bit_drill_bit_sharpen_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
