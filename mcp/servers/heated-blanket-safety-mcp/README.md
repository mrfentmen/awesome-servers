# Heated Blanket Safety Compare

Real local JSON analysis of heated blanket safety in the Heated Blanket lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/heated-blanket-safety-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "heated-blanket-safety-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/heated-blanket-safety-mcp"]
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
      "id": "heated_blanket_heated_blanket_safety-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "heated-blanket",
        "heated",
        "blanket"
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
      "id": "heated_blanket_heated_blanket_safety-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "heated-blanket",
        "heated",
        "blanket"
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
| `inventory_heated_blanket_heated_blanket_safety` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_heated_blanket_heated_blanket_safety_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_heated_blanket_heated_blanket_safety_coverage` | Show category coverage ratios and unknown categories. |
| `flag_heated_blanket_heated_blanket_safety_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_heated_blanket_heated_blanket_safety_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_heated_blanket_heated_blanket_safety_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_heated_blanket_heated_blanket_safety_baseline` | Compare category counts with the configured baseline. |
| `estimate_heated_blanket_heated_blanket_safety_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_heated_blanket_heated_blanket_safety_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_heated_blanket_heated_blanket_safety_dependencies` | Map dependency groups and show which ones are missing. |
| `test_heated_blanket_heated_blanket_safety_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_heated_blanket_heated_blanket_safety_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_heated_blanket_heated_blanket_safety_fixes` | Rank fixes by impact divided by effort. |
| `validate_heated_blanket_heated_blanket_safety_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_heated_blanket_heated_blanket_safety_duplicates` | Group items with the same category and normalized name. |
| `measure_heated_blanket_heated_blanket_safety_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_heated_blanket_heated_blanket_safety_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_heated_blanket_heated_blanket_safety_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_heated_blanket_heated_blanket_safety_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_heated_blanket_heated_blanket_safety_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_heated_blanket_heated_blanket_safety_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_heated_blanket_heated_blanket_safety_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_heated_blanket_heated_blanket_safety_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_heated_blanket_heated_blanket_safety_next_steps` | Recommend the next five actions with quick wins. |
| `open_heated_blanket_heated_blanket_safety_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
