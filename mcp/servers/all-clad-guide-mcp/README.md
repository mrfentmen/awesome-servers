# All Clad Guide Tracker

Real local JSON analysis of all clad guide in the All Clad lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/all-clad-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "all-clad-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/all-clad-guide-mcp"]
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
      "id": "all_clad_all_clad_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "all-clad",
        "all",
        "clad"
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
      "id": "all_clad_all_clad_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "all-clad",
        "all",
        "clad"
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
| `inventory_all_clad_all_clad_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_all_clad_all_clad_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_all_clad_all_clad_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_all_clad_all_clad_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_all_clad_all_clad_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_all_clad_all_clad_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_all_clad_all_clad_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_all_clad_all_clad_guide_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_all_clad_all_clad_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_all_clad_all_clad_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_all_clad_all_clad_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_all_clad_all_clad_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_all_clad_all_clad_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_all_clad_all_clad_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_all_clad_all_clad_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_all_clad_all_clad_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_all_clad_all_clad_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_all_clad_all_clad_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_all_clad_all_clad_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_all_clad_all_clad_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_all_clad_all_clad_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_all_clad_all_clad_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_all_clad_all_clad_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_all_clad_all_clad_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_all_clad_all_clad_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
