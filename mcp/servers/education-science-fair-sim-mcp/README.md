# Science Fair Simulator

Simulate science fair by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/education-science-fair-sim-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "education-science-fair-sim-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/education-science-fair-sim-mcp"]
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
      "id": "science_fair_sim-plant-light-question",
      "name": "Plant light question",
      "category": "question",
      "tags": [
        "question",
        "biology"
      ],
      "cost": 0,
      "quantity": 88,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "new"
    },
    {
      "id": "science_fair_sim-paper-bridge-method",
      "name": "Paper bridge method",
      "category": "method",
      "tags": [
        "method",
        "engineering"
      ],
      "cost": 12,
      "quantity": 84,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_science_fair_sim` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_science_fair_sim_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_science_fair_sim_coverage` | Show category coverage ratios and unknown categories. |
| `flag_science_fair_sim_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_science_fair_sim_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_science_fair_sim_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_science_fair_sim_baseline` | Compare category counts with the configured baseline. |
| `estimate_science_fair_sim_rubric_score` | Calculate the primary metric for every item with mean and pass count. |
| `find_science_fair_sim_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_science_fair_sim_dependencies` | Map dependency groups and show which ones are missing. |
| `test_science_fair_sim_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_science_fair_sim_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_science_fair_sim_fixes` | Rank fixes by impact divided by effort. |
| `validate_science_fair_sim_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_science_fair_sim_duplicates` | Group items with the same category and normalized name. |
| `measure_science_fair_sim_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_science_fair_sim_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_science_fair_sim_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_science_fair_sim_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_science_fair_sim_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_science_fair_sim_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_science_fair_sim_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_science_fair_sim_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_science_fair_sim_next_steps` | Recommend the next five actions with quick wins. |
| `open_science_fair_sim_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
