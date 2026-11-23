# Behr Paint Calculator Tracker

Real local JSON analysis of behr paint calculator in the Behr Paint lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/behr-paint-calculator-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "behr-paint-calculator-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/behr-paint-calculator-mcp"]
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
      "id": "behr_paint_behr_paint_calculator-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "behr-paint",
        "behr",
        "paint"
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
      "id": "behr_paint_behr_paint_calculator-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "behr-paint",
        "behr",
        "paint"
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
| `inventory_behr_paint_behr_paint_calculator` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_behr_paint_behr_paint_calculator_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_behr_paint_behr_paint_calculator_coverage` | Show category coverage ratios and unknown categories. |
| `flag_behr_paint_behr_paint_calculator_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_behr_paint_behr_paint_calculator_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_behr_paint_behr_paint_calculator_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_behr_paint_behr_paint_calculator_baseline` | Compare category counts with the configured baseline. |
| `estimate_behr_paint_behr_paint_calculator_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_behr_paint_behr_paint_calculator_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_behr_paint_behr_paint_calculator_dependencies` | Map dependency groups and show which ones are missing. |
| `test_behr_paint_behr_paint_calculator_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_behr_paint_behr_paint_calculator_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_behr_paint_behr_paint_calculator_fixes` | Rank fixes by impact divided by effort. |
| `validate_behr_paint_behr_paint_calculator_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_behr_paint_behr_paint_calculator_duplicates` | Group items with the same category and normalized name. |
| `measure_behr_paint_behr_paint_calculator_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_behr_paint_behr_paint_calculator_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_behr_paint_behr_paint_calculator_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_behr_paint_behr_paint_calculator_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_behr_paint_behr_paint_calculator_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_behr_paint_behr_paint_calculator_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_behr_paint_behr_paint_calculator_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_behr_paint_behr_paint_calculator_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_behr_paint_behr_paint_calculator_next_steps` | Recommend the next five actions with quick wins. |
| `open_behr_paint_behr_paint_calculator_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
