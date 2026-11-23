# Hot Tub Chemical Audit

Real local JSON analysis of hot tub chemical in the Hot Tub lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/hot-tub-chemical-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "hot-tub-chemical-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/hot-tub-chemical-guide-mcp"]
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
      "id": "hot_tub_hot_tub_chemical_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "hot-tub",
        "hot",
        "tub"
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
      "id": "hot_tub_hot_tub_chemical_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "hot-tub",
        "hot",
        "tub"
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
| `inventory_hot_tub_hot_tub_chemical_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_hot_tub_hot_tub_chemical_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_hot_tub_hot_tub_chemical_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_hot_tub_hot_tub_chemical_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_hot_tub_hot_tub_chemical_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_hot_tub_hot_tub_chemical_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_hot_tub_hot_tub_chemical_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_hot_tub_hot_tub_chemical_guide_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_hot_tub_hot_tub_chemical_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_hot_tub_hot_tub_chemical_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_hot_tub_hot_tub_chemical_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_hot_tub_hot_tub_chemical_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_hot_tub_hot_tub_chemical_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_hot_tub_hot_tub_chemical_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_hot_tub_hot_tub_chemical_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_hot_tub_hot_tub_chemical_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_hot_tub_hot_tub_chemical_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_hot_tub_hot_tub_chemical_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_hot_tub_hot_tub_chemical_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_hot_tub_hot_tub_chemical_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_hot_tub_hot_tub_chemical_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_hot_tub_hot_tub_chemical_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_hot_tub_hot_tub_chemical_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_hot_tub_hot_tub_chemical_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_hot_tub_hot_tub_chemical_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
