# Fly Tie Starter Audit

Real local JSON analysis of fly tie starter in the Fly Tie lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/fly-tie-starter-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "fly-tie-starter-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/fly-tie-starter-mcp"]
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
      "id": "fly_tie_fly_tie_starter-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "fly-tie",
        "fly",
        "tie"
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
      "id": "fly_tie_fly_tie_starter-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "fly-tie",
        "fly",
        "tie"
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
| `inventory_fly_tie_fly_tie_starter` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_fly_tie_fly_tie_starter_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_fly_tie_fly_tie_starter_coverage` | Show category coverage ratios and unknown categories. |
| `flag_fly_tie_fly_tie_starter_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_fly_tie_fly_tie_starter_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_fly_tie_fly_tie_starter_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_fly_tie_fly_tie_starter_baseline` | Compare category counts with the configured baseline. |
| `estimate_fly_tie_fly_tie_starter_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_fly_tie_fly_tie_starter_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_fly_tie_fly_tie_starter_dependencies` | Map dependency groups and show which ones are missing. |
| `test_fly_tie_fly_tie_starter_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_fly_tie_fly_tie_starter_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_fly_tie_fly_tie_starter_fixes` | Rank fixes by impact divided by effort. |
| `validate_fly_tie_fly_tie_starter_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_fly_tie_fly_tie_starter_duplicates` | Group items with the same category and normalized name. |
| `measure_fly_tie_fly_tie_starter_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_fly_tie_fly_tie_starter_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_fly_tie_fly_tie_starter_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_fly_tie_fly_tie_starter_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_fly_tie_fly_tie_starter_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_fly_tie_fly_tie_starter_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_fly_tie_fly_tie_starter_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_fly_tie_fly_tie_starter_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_fly_tie_fly_tie_starter_next_steps` | Recommend the next five actions with quick wins. |
| `open_fly_tie_fly_tie_starter_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
