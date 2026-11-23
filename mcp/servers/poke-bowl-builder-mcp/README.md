# Poke Bowl Builder Simulator

Real local JSON analysis of poke bowl builder in the Poke Bowl lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/poke-bowl-builder-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "poke-bowl-builder-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/poke-bowl-builder-mcp"]
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
      "id": "poke_bowl_poke_bowl_builder-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "poke-bowl",
        "poke",
        "bowl"
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
      "id": "poke_bowl_poke_bowl_builder-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "poke-bowl",
        "poke",
        "bowl"
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
| `inventory_poke_bowl_poke_bowl_builder` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_poke_bowl_poke_bowl_builder_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_poke_bowl_poke_bowl_builder_coverage` | Show category coverage ratios and unknown categories. |
| `flag_poke_bowl_poke_bowl_builder_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_poke_bowl_poke_bowl_builder_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_poke_bowl_poke_bowl_builder_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_poke_bowl_poke_bowl_builder_baseline` | Compare category counts with the configured baseline. |
| `estimate_poke_bowl_poke_bowl_builder_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_poke_bowl_poke_bowl_builder_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_poke_bowl_poke_bowl_builder_dependencies` | Map dependency groups and show which ones are missing. |
| `test_poke_bowl_poke_bowl_builder_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_poke_bowl_poke_bowl_builder_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_poke_bowl_poke_bowl_builder_fixes` | Rank fixes by impact divided by effort. |
| `validate_poke_bowl_poke_bowl_builder_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_poke_bowl_poke_bowl_builder_duplicates` | Group items with the same category and normalized name. |
| `measure_poke_bowl_poke_bowl_builder_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_poke_bowl_poke_bowl_builder_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_poke_bowl_poke_bowl_builder_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_poke_bowl_poke_bowl_builder_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_poke_bowl_poke_bowl_builder_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_poke_bowl_poke_bowl_builder_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_poke_bowl_poke_bowl_builder_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_poke_bowl_poke_bowl_builder_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_poke_bowl_poke_bowl_builder_next_steps` | Recommend the next five actions with quick wins. |
| `open_poke_bowl_poke_bowl_builder_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
