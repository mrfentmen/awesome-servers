# Nurses Week Guide Archive

Real local JSON analysis of nurses week guide in the Nurses Week lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/nurses-week-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "nurses-week-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/nurses-week-guide-mcp"]
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
      "id": "nurses_week_nurses_week_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "nurses-week",
        "nurses",
        "week"
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
      "id": "nurses_week_nurses_week_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "nurses-week",
        "nurses",
        "week"
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
| `inventory_nurses_week_nurses_week_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_nurses_week_nurses_week_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_nurses_week_nurses_week_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_nurses_week_nurses_week_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_nurses_week_nurses_week_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_nurses_week_nurses_week_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_nurses_week_nurses_week_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_nurses_week_nurses_week_guide_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_nurses_week_nurses_week_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_nurses_week_nurses_week_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_nurses_week_nurses_week_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_nurses_week_nurses_week_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_nurses_week_nurses_week_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_nurses_week_nurses_week_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_nurses_week_nurses_week_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_nurses_week_nurses_week_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_nurses_week_nurses_week_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_nurses_week_nurses_week_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_nurses_week_nurses_week_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_nurses_week_nurses_week_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_nurses_week_nurses_week_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_nurses_week_nurses_week_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_nurses_week_nurses_week_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_nurses_week_nurses_week_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_nurses_week_nurses_week_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
