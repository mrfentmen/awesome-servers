# house-cleaning tracker Tracker

Real local JSON analysis of house-cleaning tracker in the Home Services & Moving lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/house-cleaning-tracker-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "house-cleaning-tracker-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/house-cleaning-tracker-mcp"]
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
      "id": "homeservices_house_cleaning_tracker-homeservices-1",
      "name": "homeservices primary",
      "category": "homeservices",
      "tags": [
        "home-services-moving",
        "house",
        "cleaning"
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
      "id": "homeservices_house_cleaning_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "home-services-moving",
        "house",
        "cleaning"
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
| `inventory_homeservices_house_cleaning_tracker` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_homeservices_house_cleaning_tracker_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_homeservices_house_cleaning_tracker_coverage` | Show category coverage ratios and unknown categories. |
| `flag_homeservices_house_cleaning_tracker_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_homeservices_house_cleaning_tracker_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_homeservices_house_cleaning_tracker_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_homeservices_house_cleaning_tracker_baseline` | Compare category counts with the configured baseline. |
| `estimate_homeservices_house_cleaning_tracker_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_homeservices_house_cleaning_tracker_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_homeservices_house_cleaning_tracker_dependencies` | Map dependency groups and show which ones are missing. |
| `test_homeservices_house_cleaning_tracker_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_homeservices_house_cleaning_tracker_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_homeservices_house_cleaning_tracker_fixes` | Rank fixes by impact divided by effort. |
| `validate_homeservices_house_cleaning_tracker_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_homeservices_house_cleaning_tracker_duplicates` | Group items with the same category and normalized name. |
| `measure_homeservices_house_cleaning_tracker_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_homeservices_house_cleaning_tracker_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_homeservices_house_cleaning_tracker_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_homeservices_house_cleaning_tracker_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_homeservices_house_cleaning_tracker_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_homeservices_house_cleaning_tracker_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_homeservices_house_cleaning_tracker_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_homeservices_house_cleaning_tracker_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_homeservices_house_cleaning_tracker_next_steps` | Recommend the next five actions with quick wins. |
| `open_homeservices_house_cleaning_tracker_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
