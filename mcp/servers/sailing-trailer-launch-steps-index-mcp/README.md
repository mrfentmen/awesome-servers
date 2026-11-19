# Trailer Launch Steps Archive

Real local JSON analysis of trailer launch steps in the Sailing lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/sailing-trailer-launch-steps-index-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "sailing-trailer-launch-steps-index-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/sailing-trailer-launch-steps-index-mcp"]
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
      "id": "sailing_sailing_trailer_launch_steps_index-records-1",
      "name": "Records primary",
      "category": "records",
      "tags": [
        "sailing",
        "sailing",
        "trailer"
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
      "id": "sailing_sailing_trailer_launch_steps_index-tags-2",
      "name": "Tags primary",
      "category": "tags",
      "tags": [
        "sailing",
        "sailing",
        "trailer"
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
| `inventory_sailing_sailing_trailer_launch_steps_index` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_sailing_sailing_trailer_launch_steps_index_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_sailing_sailing_trailer_launch_steps_index_coverage` | Show category coverage ratios and unknown categories. |
| `flag_sailing_sailing_trailer_launch_steps_index_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_sailing_sailing_trailer_launch_steps_index_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_sailing_sailing_trailer_launch_steps_index_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_sailing_sailing_trailer_launch_steps_index_baseline` | Compare category counts with the configured baseline. |
| `estimate_sailing_sailing_trailer_launch_steps_index_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_sailing_sailing_trailer_launch_steps_index_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_sailing_sailing_trailer_launch_steps_index_dependencies` | Map dependency groups and show which ones are missing. |
| `test_sailing_sailing_trailer_launch_steps_index_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_sailing_sailing_trailer_launch_steps_index_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_sailing_sailing_trailer_launch_steps_index_fixes` | Rank fixes by impact divided by effort. |
| `validate_sailing_sailing_trailer_launch_steps_index_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_sailing_sailing_trailer_launch_steps_index_duplicates` | Group items with the same category and normalized name. |
| `measure_sailing_sailing_trailer_launch_steps_index_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_sailing_sailing_trailer_launch_steps_index_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_sailing_sailing_trailer_launch_steps_index_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_sailing_sailing_trailer_launch_steps_index_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_sailing_sailing_trailer_launch_steps_index_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_sailing_sailing_trailer_launch_steps_index_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_sailing_sailing_trailer_launch_steps_index_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_sailing_sailing_trailer_launch_steps_index_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_sailing_sailing_trailer_launch_steps_index_next_steps` | Recommend the next five actions with quick wins. |
| `open_sailing_sailing_trailer_launch_steps_index_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
