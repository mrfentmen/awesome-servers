# Allergy Free Lunch Simulator

Real local JSON analysis of allergy free lunch in the Allergy Free lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/allergy-free-lunch-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "allergy-free-lunch-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/allergy-free-lunch-mcp"]
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
      "id": "allergy_free_allergy_free_lunch-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "allergy-free",
        "allergy",
        "free"
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
      "id": "allergy_free_allergy_free_lunch-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "allergy-free",
        "allergy",
        "free"
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
| `inventory_allergy_free_allergy_free_lunch` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_allergy_free_allergy_free_lunch_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_allergy_free_allergy_free_lunch_coverage` | Show category coverage ratios and unknown categories. |
| `flag_allergy_free_allergy_free_lunch_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_allergy_free_allergy_free_lunch_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_allergy_free_allergy_free_lunch_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_allergy_free_allergy_free_lunch_baseline` | Compare category counts with the configured baseline. |
| `estimate_allergy_free_allergy_free_lunch_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_allergy_free_allergy_free_lunch_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_allergy_free_allergy_free_lunch_dependencies` | Map dependency groups and show which ones are missing. |
| `test_allergy_free_allergy_free_lunch_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_allergy_free_allergy_free_lunch_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_allergy_free_allergy_free_lunch_fixes` | Rank fixes by impact divided by effort. |
| `validate_allergy_free_allergy_free_lunch_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_allergy_free_allergy_free_lunch_duplicates` | Group items with the same category and normalized name. |
| `measure_allergy_free_allergy_free_lunch_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_allergy_free_allergy_free_lunch_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_allergy_free_allergy_free_lunch_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_allergy_free_allergy_free_lunch_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_allergy_free_allergy_free_lunch_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_allergy_free_allergy_free_lunch_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_allergy_free_allergy_free_lunch_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_allergy_free_allergy_free_lunch_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_allergy_free_allergy_free_lunch_next_steps` | Recommend the next five actions with quick wins. |
| `open_allergy_free_allergy_free_lunch_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
