# Barrier Repair Audit

Audit barrier repair by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/skincare-barrier-repair-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "skincare-barrier-repair-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/skincare-barrier-repair-check-mcp"]
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
      "id": "barrier_repair-cleanser",
      "name": "Cream cleanser",
      "category": "cleanser",
      "tags": [
        "fragrance-free",
        "gentle"
      ],
      "cost": 24,
      "quantity": 75,
      "condition": "good"
    },
    {
      "id": "barrier_repair-ceramide",
      "name": "Ceramide cream",
      "category": "ceramide",
      "tags": [
        "ceramide",
        "night"
      ],
      "cost": 32,
      "quantity": 85,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_barrier_repair` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_barrier_repair_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_barrier_repair_coverage` | Show category coverage ratios and unknown categories. |
| `flag_barrier_repair_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_barrier_repair_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_barrier_repair_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_barrier_repair_baseline` | Compare category counts with the configured baseline. |
| `estimate_barrier_repair_barrier_score` | Calculate the primary metric for every item with mean and pass count. |
| `find_barrier_repair_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_barrier_repair_dependencies` | Map dependency groups and show which ones are missing. |
| `test_barrier_repair_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_barrier_repair_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_barrier_repair_fixes` | Rank fixes by impact divided by effort. |
| `validate_barrier_repair_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_barrier_repair_duplicates` | Group items with the same category and normalized name. |
| `measure_barrier_repair_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_barrier_repair_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_barrier_repair_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_barrier_repair_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_barrier_repair_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_barrier_repair_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_barrier_repair_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_barrier_repair_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_barrier_repair_next_steps` | Recommend the next five actions with quick wins. |
| `open_barrier_repair_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
