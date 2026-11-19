# Lost Pet Flyer Search Audit

Lost Pet Flyer Search Audit: flyer and search log. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/lost-pet-flyer-search-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "lost-pet-flyer-search-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/lost-pet-flyer-search-mcp"]
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
      "id": "lost_pet-sample-1",
      "name": "Sample dogs entry",
      "category": "dogs",
      "tags": [
        "lost-pet"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "lost_pet-sample-2",
      "name": "Sample cats entry",
      "category": "cats",
      "tags": [
        "lost-pet"
      ],
      "cost": 30,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_lost_pet` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_lost_pet_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_lost_pet_coverage` | Show category coverage ratios and unknown categories. |
| `flag_lost_pet_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_lost_pet_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_lost_pet_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_lost_pet_baseline` | Compare category counts with the configured baseline. |
| `estimate_lost_pet_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_lost_pet_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_lost_pet_dependencies` | Map dependency groups and show which ones are missing. |
| `test_lost_pet_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_lost_pet_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_lost_pet_fixes` | Rank fixes by impact divided by effort. |
| `validate_lost_pet_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_lost_pet_duplicates` | Group items with the same category and normalized name. |
| `measure_lost_pet_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_lost_pet_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_lost_pet_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_lost_pet_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_lost_pet_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_lost_pet_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_lost_pet_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_lost_pet_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_lost_pet_next_steps` | Recommend the next five actions with quick wins. |
| `open_lost_pet_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
