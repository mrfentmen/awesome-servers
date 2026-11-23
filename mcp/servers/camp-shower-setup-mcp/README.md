# Camp Shower Setup Planner

Real local JSON analysis of camp shower setup in the Camp Shower lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/camp-shower-setup-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "camp-shower-setup-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/camp-shower-setup-mcp"]
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
      "id": "camp_shower_camp_shower_setup-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "camp-shower",
        "camp",
        "shower"
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
      "id": "camp_shower_camp_shower_setup-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "camp-shower",
        "camp",
        "shower"
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
| `inventory_camp_shower_camp_shower_setup` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_camp_shower_camp_shower_setup_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_camp_shower_camp_shower_setup_coverage` | Show category coverage ratios and unknown categories. |
| `flag_camp_shower_camp_shower_setup_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_camp_shower_camp_shower_setup_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_camp_shower_camp_shower_setup_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_camp_shower_camp_shower_setup_baseline` | Compare category counts with the configured baseline. |
| `estimate_camp_shower_camp_shower_setup_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_camp_shower_camp_shower_setup_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_camp_shower_camp_shower_setup_dependencies` | Map dependency groups and show which ones are missing. |
| `test_camp_shower_camp_shower_setup_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_camp_shower_camp_shower_setup_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_camp_shower_camp_shower_setup_fixes` | Rank fixes by impact divided by effort. |
| `validate_camp_shower_camp_shower_setup_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_camp_shower_camp_shower_setup_duplicates` | Group items with the same category and normalized name. |
| `measure_camp_shower_camp_shower_setup_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_camp_shower_camp_shower_setup_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_camp_shower_camp_shower_setup_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_camp_shower_camp_shower_setup_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_camp_shower_camp_shower_setup_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_camp_shower_camp_shower_setup_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_camp_shower_camp_shower_setup_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_camp_shower_camp_shower_setup_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_camp_shower_camp_shower_setup_next_steps` | Recommend the next five actions with quick wins. |
| `open_camp_shower_camp_shower_setup_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
