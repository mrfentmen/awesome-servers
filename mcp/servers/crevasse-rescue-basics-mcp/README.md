# Crevasse Rescue Basics Budget

Real local JSON analysis of crevasse rescue basics in the Crevasse Rescue lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/crevasse-rescue-basics-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "crevasse-rescue-basics-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/crevasse-rescue-basics-mcp"]
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
      "id": "crevasse_rescue_crevasse_rescue_basics-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "crevasse-rescue",
        "crevasse",
        "rescue"
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
      "id": "crevasse_rescue_crevasse_rescue_basics-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "crevasse-rescue",
        "crevasse",
        "rescue"
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
| `inventory_crevasse_rescue_crevasse_rescue_basics` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_crevasse_rescue_crevasse_rescue_basics_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_crevasse_rescue_crevasse_rescue_basics_coverage` | Show category coverage ratios and unknown categories. |
| `flag_crevasse_rescue_crevasse_rescue_basics_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_crevasse_rescue_crevasse_rescue_basics_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_crevasse_rescue_crevasse_rescue_basics_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_crevasse_rescue_crevasse_rescue_basics_baseline` | Compare category counts with the configured baseline. |
| `estimate_crevasse_rescue_crevasse_rescue_basics_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_crevasse_rescue_crevasse_rescue_basics_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_crevasse_rescue_crevasse_rescue_basics_dependencies` | Map dependency groups and show which ones are missing. |
| `test_crevasse_rescue_crevasse_rescue_basics_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_crevasse_rescue_crevasse_rescue_basics_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_crevasse_rescue_crevasse_rescue_basics_fixes` | Rank fixes by impact divided by effort. |
| `validate_crevasse_rescue_crevasse_rescue_basics_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_crevasse_rescue_crevasse_rescue_basics_duplicates` | Group items with the same category and normalized name. |
| `measure_crevasse_rescue_crevasse_rescue_basics_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_crevasse_rescue_crevasse_rescue_basics_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_crevasse_rescue_crevasse_rescue_basics_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_crevasse_rescue_crevasse_rescue_basics_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_crevasse_rescue_crevasse_rescue_basics_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_crevasse_rescue_crevasse_rescue_basics_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_crevasse_rescue_crevasse_rescue_basics_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_crevasse_rescue_crevasse_rescue_basics_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_crevasse_rescue_crevasse_rescue_basics_next_steps` | Recommend the next five actions with quick wins. |
| `open_crevasse_rescue_crevasse_rescue_basics_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
