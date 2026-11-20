# Bird Bath Care Archive

Real local JSON analysis of bird bath care in the Birding lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/birding-bird-bath-care-index-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "birding-bird-bath-care-index-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/birding-bird-bath-care-index-mcp"]
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
      "id": "birding_birding_bird_bath_care_index-records-1",
      "name": "Records primary",
      "category": "records",
      "tags": [
        "birding",
        "birding",
        "bird"
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
      "id": "birding_birding_bird_bath_care_index-tags-2",
      "name": "Tags primary",
      "category": "tags",
      "tags": [
        "birding",
        "birding",
        "bird"
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
| `inventory_birding_birding_bird_bath_care_index` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_birding_birding_bird_bath_care_index_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_birding_birding_bird_bath_care_index_coverage` | Show category coverage ratios and unknown categories. |
| `flag_birding_birding_bird_bath_care_index_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_birding_birding_bird_bath_care_index_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_birding_birding_bird_bath_care_index_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_birding_birding_bird_bath_care_index_baseline` | Compare category counts with the configured baseline. |
| `estimate_birding_birding_bird_bath_care_index_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_birding_birding_bird_bath_care_index_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_birding_birding_bird_bath_care_index_dependencies` | Map dependency groups and show which ones are missing. |
| `test_birding_birding_bird_bath_care_index_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_birding_birding_bird_bath_care_index_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_birding_birding_bird_bath_care_index_fixes` | Rank fixes by impact divided by effort. |
| `validate_birding_birding_bird_bath_care_index_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_birding_birding_bird_bath_care_index_duplicates` | Group items with the same category and normalized name. |
| `measure_birding_birding_bird_bath_care_index_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_birding_birding_bird_bath_care_index_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_birding_birding_bird_bath_care_index_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_birding_birding_bird_bath_care_index_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_birding_birding_bird_bath_care_index_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_birding_birding_bird_bath_care_index_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_birding_birding_bird_bath_care_index_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_birding_birding_bird_bath_care_index_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_birding_birding_bird_bath_care_index_next_steps` | Recommend the next five actions with quick wins. |
| `open_birding_birding_bird_bath_care_index_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
