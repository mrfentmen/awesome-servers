# Seed Starting Budget Audit

Audit seed starting budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/gardening-seed-starting-cost-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "gardening-seed-starting-cost-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/gardening-seed-starting-cost-mcp"]
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
      "id": "seed_starting_budget-genovese-basil",
      "name": "Genovese basil",
      "category": "herb",
      "tags": [
        "budget"
      ],
      "cost": 4,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "seed_starting_budget-cherry-tomato",
      "name": "Cherry tomato",
      "category": "vegetable",
      "tags": [
        "budget"
      ],
      "cost": 5,
      "quantity": 5,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_seed_starting_budget` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_seed_starting_budget_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_seed_starting_budget_coverage` | Show category coverage ratios and unknown categories. |
| `flag_seed_starting_budget_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_seed_starting_budget_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_seed_starting_budget_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_seed_starting_budget_baseline` | Compare category counts with the configured baseline. |
| `estimate_seed_starting_budget_line_cost` | Calculate the primary metric for every item with mean and pass count. |
| `find_seed_starting_budget_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_seed_starting_budget_dependencies` | Map dependency groups and show which ones are missing. |
| `test_seed_starting_budget_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_seed_starting_budget_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_seed_starting_budget_fixes` | Rank fixes by impact divided by effort. |
| `validate_seed_starting_budget_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_seed_starting_budget_duplicates` | Group items with the same category and normalized name. |
| `measure_seed_starting_budget_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_seed_starting_budget_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_seed_starting_budget_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_seed_starting_budget_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_seed_starting_budget_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_seed_starting_budget_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_seed_starting_budget_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_seed_starting_budget_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_seed_starting_budget_next_steps` | Recommend the next five actions with quick wins. |
| `open_seed_starting_budget_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
