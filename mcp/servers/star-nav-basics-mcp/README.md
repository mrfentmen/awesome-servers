# Star Nav Basics Matcher

Real local JSON analysis of star nav basics in the Star Nav lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/star-nav-basics-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "star-nav-basics-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/star-nav-basics-mcp"]
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
      "id": "star_nav_star_nav_basics-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "star-nav",
        "star",
        "nav"
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
      "id": "star_nav_star_nav_basics-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "star-nav",
        "star",
        "nav"
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
| `inventory_star_nav_star_nav_basics` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_star_nav_star_nav_basics_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_star_nav_star_nav_basics_coverage` | Show category coverage ratios and unknown categories. |
| `flag_star_nav_star_nav_basics_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_star_nav_star_nav_basics_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_star_nav_star_nav_basics_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_star_nav_star_nav_basics_baseline` | Compare category counts with the configured baseline. |
| `estimate_star_nav_star_nav_basics_clearance_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_star_nav_star_nav_basics_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_star_nav_star_nav_basics_dependencies` | Map dependency groups and show which ones are missing. |
| `test_star_nav_star_nav_basics_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_star_nav_star_nav_basics_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_star_nav_star_nav_basics_fixes` | Rank fixes by impact divided by effort. |
| `validate_star_nav_star_nav_basics_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_star_nav_star_nav_basics_duplicates` | Group items with the same category and normalized name. |
| `measure_star_nav_star_nav_basics_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_star_nav_star_nav_basics_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_star_nav_star_nav_basics_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_star_nav_star_nav_basics_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_star_nav_star_nav_basics_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_star_nav_star_nav_basics_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_star_nav_star_nav_basics_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_star_nav_star_nav_basics_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_star_nav_star_nav_basics_next_steps` | Recommend the next five actions with quick wins. |
| `open_star_nav_star_nav_basics_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
