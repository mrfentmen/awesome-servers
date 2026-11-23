# Netflix New Releases Tracker

Real local JSON analysis of netflix new releases in the Netflix New lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/netflix-new-releases-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "netflix-new-releases-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/netflix-new-releases-mcp"]
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
      "id": "netflix_new_netflix_new_releases-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "netflix-new",
        "netflix",
        "new"
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
      "id": "netflix_new_netflix_new_releases-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "netflix-new",
        "netflix",
        "new"
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
| `inventory_netflix_new_netflix_new_releases` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_netflix_new_netflix_new_releases_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_netflix_new_netflix_new_releases_coverage` | Show category coverage ratios and unknown categories. |
| `flag_netflix_new_netflix_new_releases_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_netflix_new_netflix_new_releases_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_netflix_new_netflix_new_releases_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_netflix_new_netflix_new_releases_baseline` | Compare category counts with the configured baseline. |
| `estimate_netflix_new_netflix_new_releases_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_netflix_new_netflix_new_releases_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_netflix_new_netflix_new_releases_dependencies` | Map dependency groups and show which ones are missing. |
| `test_netflix_new_netflix_new_releases_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_netflix_new_netflix_new_releases_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_netflix_new_netflix_new_releases_fixes` | Rank fixes by impact divided by effort. |
| `validate_netflix_new_netflix_new_releases_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_netflix_new_netflix_new_releases_duplicates` | Group items with the same category and normalized name. |
| `measure_netflix_new_netflix_new_releases_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_netflix_new_netflix_new_releases_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_netflix_new_netflix_new_releases_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_netflix_new_netflix_new_releases_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_netflix_new_netflix_new_releases_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_netflix_new_netflix_new_releases_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_netflix_new_netflix_new_releases_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_netflix_new_netflix_new_releases_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_netflix_new_netflix_new_releases_next_steps` | Recommend the next five actions with quick wins. |
| `open_netflix_new_netflix_new_releases_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
