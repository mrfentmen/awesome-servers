# Caulk Line Guide Simulator

Real local JSON analysis of caulk line guide in the Caulk Line lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/caulk-line-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "caulk-line-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/caulk-line-guide-mcp"]
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
      "id": "caulk_line_caulk_line_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "caulk-line",
        "caulk",
        "line"
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
      "id": "caulk_line_caulk_line_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "caulk-line",
        "caulk",
        "line"
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
| `inventory_caulk_line_caulk_line_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_caulk_line_caulk_line_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_caulk_line_caulk_line_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_caulk_line_caulk_line_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_caulk_line_caulk_line_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_caulk_line_caulk_line_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_caulk_line_caulk_line_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_caulk_line_caulk_line_guide_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_caulk_line_caulk_line_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_caulk_line_caulk_line_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_caulk_line_caulk_line_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_caulk_line_caulk_line_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_caulk_line_caulk_line_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_caulk_line_caulk_line_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_caulk_line_caulk_line_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_caulk_line_caulk_line_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_caulk_line_caulk_line_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_caulk_line_caulk_line_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_caulk_line_caulk_line_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_caulk_line_caulk_line_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_caulk_line_caulk_line_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_caulk_line_caulk_line_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_caulk_line_caulk_line_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_caulk_line_caulk_line_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_caulk_line_caulk_line_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
