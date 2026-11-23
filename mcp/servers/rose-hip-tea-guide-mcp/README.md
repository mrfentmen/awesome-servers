# Rose Hip Tea Simulator

Real local JSON analysis of rose hip tea in the Rose Hip lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/rose-hip-tea-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "rose-hip-tea-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/rose-hip-tea-guide-mcp"]
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
      "id": "rose_hip_rose_hip_tea_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "rose-hip",
        "rose",
        "hip"
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
      "id": "rose_hip_rose_hip_tea_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "rose-hip",
        "rose",
        "hip"
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
| `inventory_rose_hip_rose_hip_tea_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_rose_hip_rose_hip_tea_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_rose_hip_rose_hip_tea_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_rose_hip_rose_hip_tea_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_rose_hip_rose_hip_tea_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_rose_hip_rose_hip_tea_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_rose_hip_rose_hip_tea_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_rose_hip_rose_hip_tea_guide_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_rose_hip_rose_hip_tea_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_rose_hip_rose_hip_tea_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_rose_hip_rose_hip_tea_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_rose_hip_rose_hip_tea_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_rose_hip_rose_hip_tea_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_rose_hip_rose_hip_tea_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_rose_hip_rose_hip_tea_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_rose_hip_rose_hip_tea_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_rose_hip_rose_hip_tea_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_rose_hip_rose_hip_tea_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_rose_hip_rose_hip_tea_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_rose_hip_rose_hip_tea_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_rose_hip_rose_hip_tea_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_rose_hip_rose_hip_tea_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_rose_hip_rose_hip_tea_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_rose_hip_rose_hip_tea_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_rose_hip_rose_hip_tea_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
