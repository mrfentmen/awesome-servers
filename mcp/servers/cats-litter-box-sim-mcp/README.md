# Litter Box Simulator

Simulate litter box by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/cats-litter-box-sim-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "cats-litter-box-sim-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/cats-litter-box-sim-mcp"]
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
      "id": "litter-clump",
      "name": "Clumping litter",
      "category": "litter",
      "tags": [
        "unscented"
      ],
      "cost": 18,
      "quantity": 1,
      "expires": "2027-06-01",
      "condition": "new"
    },
    {
      "id": "litter-box",
      "name": "Open litter box",
      "category": "box",
      "tags": [
        "plastic"
      ],
      "cost": 25,
      "quantity": 1,
      "expires": "2030-01-01",
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_litter_box_sim` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_litter_box_sim_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_litter_box_sim_coverage` | Show category coverage ratios and unknown categories. |
| `flag_litter_box_sim_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_litter_box_sim_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_litter_box_sim_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_litter_box_sim_baseline` | Compare category counts with the configured baseline. |
| `estimate_litter_box_sim_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_litter_box_sim_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_litter_box_sim_dependencies` | Map dependency groups and show which ones are missing. |
| `test_litter_box_sim_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_litter_box_sim_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_litter_box_sim_fixes` | Rank fixes by impact divided by effort. |
| `validate_litter_box_sim_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_litter_box_sim_duplicates` | Group items with the same category and normalized name. |
| `measure_litter_box_sim_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_litter_box_sim_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_litter_box_sim_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_litter_box_sim_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_litter_box_sim_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_litter_box_sim_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_litter_box_sim_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_litter_box_sim_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_litter_box_sim_next_steps` | Recommend the next five actions with quick wins. |
| `open_litter_box_sim_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
