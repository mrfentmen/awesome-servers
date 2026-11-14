# Seed Starting Plan Audit

Plan seed starting from germination rates, category coverage, expiry windows and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/gardening-seed-starting-plan-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "gardening-seed-starting-plan-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/gardening-seed-starting-plan-mcp"]
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
      "id": "seed-basil",
      "name": "Genovese basil",
      "category": "herb",
      "tags": [
        "annual"
      ],
      "cost": 4,
      "quantity": 85,
      "acquired": "2026-03-01",
      "expires": "2027-03-01",
      "condition": "good"
    },
    {
      "id": "seed-tomato",
      "name": "Cherry tomato",
      "category": "vegetable",
      "tags": [
        "indeterminate"
      ],
      "cost": 5,
      "quantity": 92,
      "acquired": "2026-02-01",
      "expires": "2027-02-01",
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_seed_starting` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_seed_starting_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_seed_starting_coverage` | Show category coverage ratios and unknown categories. |
| `flag_seed_starting_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_seed_starting_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_seed_starting_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_seed_starting_baseline` | Compare category counts with the configured baseline. |
| `estimate_seed_starting_germination_rate` | Calculate the primary metric for every item with mean and pass count. |
| `find_seed_starting_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_seed_starting_dependencies` | Map dependency groups and show which ones are missing. |
| `test_seed_starting_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_seed_starting_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_seed_starting_fixes` | Rank fixes by impact divided by effort. |
| `validate_seed_starting_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_seed_starting_duplicates` | Group items with the same category and normalized name. |
| `measure_seed_starting_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_seed_starting_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_seed_starting_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_seed_starting_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_seed_starting_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_seed_starting_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_seed_starting_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_seed_starting_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_seed_starting_next_steps` | Recommend the next five actions with quick wins. |
| `open_seed_starting_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
