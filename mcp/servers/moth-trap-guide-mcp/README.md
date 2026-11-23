# Moth Trap Guide Planner

Real local JSON analysis of moth trap guide in the Moth Trap lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/moth-trap-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "moth-trap-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/moth-trap-guide-mcp"]
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
      "id": "moth_trap_moth_trap_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "moth-trap",
        "moth",
        "trap"
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
      "id": "moth_trap_moth_trap_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "moth-trap",
        "moth",
        "trap"
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
| `inventory_moth_trap_moth_trap_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_moth_trap_moth_trap_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_moth_trap_moth_trap_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_moth_trap_moth_trap_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_moth_trap_moth_trap_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_moth_trap_moth_trap_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_moth_trap_moth_trap_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_moth_trap_moth_trap_guide_days_to_expiry` | Calculate the primary metric for every item with mean and pass count. |
| `find_moth_trap_moth_trap_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_moth_trap_moth_trap_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_moth_trap_moth_trap_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_moth_trap_moth_trap_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_moth_trap_moth_trap_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_moth_trap_moth_trap_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_moth_trap_moth_trap_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_moth_trap_moth_trap_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_moth_trap_moth_trap_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_moth_trap_moth_trap_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_moth_trap_moth_trap_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_moth_trap_moth_trap_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_moth_trap_moth_trap_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_moth_trap_moth_trap_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_moth_trap_moth_trap_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_moth_trap_moth_trap_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_moth_trap_moth_trap_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
