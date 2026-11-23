# Community College Finder Matcher

Real local JSON analysis of community college finder in the Community College lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/community-college-finder-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "community-college-finder-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/community-college-finder-mcp"]
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
      "id": "community_college_community_college_finder-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "community-college",
        "community",
        "college"
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
      "id": "community_college_community_college_finder-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "community-college",
        "community",
        "college"
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
| `inventory_community_college_community_college_finder` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_community_college_community_college_finder_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_community_college_community_college_finder_coverage` | Show category coverage ratios and unknown categories. |
| `flag_community_college_community_college_finder_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_community_college_community_college_finder_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_community_college_community_college_finder_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_community_college_community_college_finder_baseline` | Compare category counts with the configured baseline. |
| `estimate_community_college_community_college_finder_clearance_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_community_college_community_college_finder_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_community_college_community_college_finder_dependencies` | Map dependency groups and show which ones are missing. |
| `test_community_college_community_college_finder_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_community_college_community_college_finder_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_community_college_community_college_finder_fixes` | Rank fixes by impact divided by effort. |
| `validate_community_college_community_college_finder_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_community_college_community_college_finder_duplicates` | Group items with the same category and normalized name. |
| `measure_community_college_community_college_finder_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_community_college_community_college_finder_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_community_college_community_college_finder_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_community_college_community_college_finder_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_community_college_community_college_finder_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_community_college_community_college_finder_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_community_college_community_college_finder_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_community_college_community_college_finder_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_community_college_community_college_finder_next_steps` | Recommend the next five actions with quick wins. |
| `open_community_college_community_college_finder_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
