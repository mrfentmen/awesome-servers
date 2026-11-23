# Perfume Blend Guide Audit

Real local JSON analysis of perfume blend guide in the Perfume Blend lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/perfume-blend-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "perfume-blend-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/perfume-blend-guide-mcp"]
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
      "id": "perfume_blend_perfume_blend_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "perfume-blend",
        "perfume",
        "blend"
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
      "id": "perfume_blend_perfume_blend_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "perfume-blend",
        "perfume",
        "blend"
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
| `inventory_perfume_blend_perfume_blend_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_perfume_blend_perfume_blend_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_perfume_blend_perfume_blend_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_perfume_blend_perfume_blend_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_perfume_blend_perfume_blend_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_perfume_blend_perfume_blend_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_perfume_blend_perfume_blend_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_perfume_blend_perfume_blend_guide_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_perfume_blend_perfume_blend_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_perfume_blend_perfume_blend_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_perfume_blend_perfume_blend_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_perfume_blend_perfume_blend_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_perfume_blend_perfume_blend_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_perfume_blend_perfume_blend_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_perfume_blend_perfume_blend_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_perfume_blend_perfume_blend_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_perfume_blend_perfume_blend_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_perfume_blend_perfume_blend_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_perfume_blend_perfume_blend_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_perfume_blend_perfume_blend_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_perfume_blend_perfume_blend_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_perfume_blend_perfume_blend_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_perfume_blend_perfume_blend_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_perfume_blend_perfume_blend_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_perfume_blend_perfume_blend_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
