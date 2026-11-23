# Debris Hut Build Planner

Real local JSON analysis of debris hut build in the Debris Hut lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/debris-hut-build-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "debris-hut-build-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/debris-hut-build-mcp"]
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
      "id": "debris_hut_debris_hut_build-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "debris-hut",
        "debris",
        "hut"
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
      "id": "debris_hut_debris_hut_build-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "debris-hut",
        "debris",
        "hut"
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
| `inventory_debris_hut_debris_hut_build` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_debris_hut_debris_hut_build_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_debris_hut_debris_hut_build_coverage` | Show category coverage ratios and unknown categories. |
| `flag_debris_hut_debris_hut_build_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_debris_hut_debris_hut_build_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_debris_hut_debris_hut_build_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_debris_hut_debris_hut_build_baseline` | Compare category counts with the configured baseline. |
| `estimate_debris_hut_debris_hut_build_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_debris_hut_debris_hut_build_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_debris_hut_debris_hut_build_dependencies` | Map dependency groups and show which ones are missing. |
| `test_debris_hut_debris_hut_build_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_debris_hut_debris_hut_build_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_debris_hut_debris_hut_build_fixes` | Rank fixes by impact divided by effort. |
| `validate_debris_hut_debris_hut_build_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_debris_hut_debris_hut_build_duplicates` | Group items with the same category and normalized name. |
| `measure_debris_hut_debris_hut_build_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_debris_hut_debris_hut_build_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_debris_hut_debris_hut_build_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_debris_hut_debris_hut_build_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_debris_hut_debris_hut_build_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_debris_hut_debris_hut_build_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_debris_hut_debris_hut_build_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_debris_hut_debris_hut_build_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_debris_hut_debris_hut_build_next_steps` | Recommend the next five actions with quick wins. |
| `open_debris_hut_debris_hut_build_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
