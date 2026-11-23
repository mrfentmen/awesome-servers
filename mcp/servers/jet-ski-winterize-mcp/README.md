# Jet Ski Winterize Planner

Real local JSON analysis of jet ski winterize in the Jet Ski lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/jet-ski-winterize-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "jet-ski-winterize-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/jet-ski-winterize-mcp"]
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
      "id": "jet_ski_jet_ski_winterize-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "jet-ski",
        "jet",
        "ski"
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
      "id": "jet_ski_jet_ski_winterize-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "jet-ski",
        "jet",
        "ski"
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
| `inventory_jet_ski_jet_ski_winterize` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_jet_ski_jet_ski_winterize_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_jet_ski_jet_ski_winterize_coverage` | Show category coverage ratios and unknown categories. |
| `flag_jet_ski_jet_ski_winterize_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_jet_ski_jet_ski_winterize_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_jet_ski_jet_ski_winterize_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_jet_ski_jet_ski_winterize_baseline` | Compare category counts with the configured baseline. |
| `estimate_jet_ski_jet_ski_winterize_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_jet_ski_jet_ski_winterize_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_jet_ski_jet_ski_winterize_dependencies` | Map dependency groups and show which ones are missing. |
| `test_jet_ski_jet_ski_winterize_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_jet_ski_jet_ski_winterize_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_jet_ski_jet_ski_winterize_fixes` | Rank fixes by impact divided by effort. |
| `validate_jet_ski_jet_ski_winterize_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_jet_ski_jet_ski_winterize_duplicates` | Group items with the same category and normalized name. |
| `measure_jet_ski_jet_ski_winterize_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_jet_ski_jet_ski_winterize_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_jet_ski_jet_ski_winterize_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_jet_ski_jet_ski_winterize_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_jet_ski_jet_ski_winterize_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_jet_ski_jet_ski_winterize_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_jet_ski_jet_ski_winterize_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_jet_ski_jet_ski_winterize_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_jet_ski_jet_ski_winterize_next_steps` | Recommend the next five actions with quick wins. |
| `open_jet_ski_jet_ski_winterize_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
