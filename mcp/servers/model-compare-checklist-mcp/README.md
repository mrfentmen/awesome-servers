# model compare checklist Checklist

Real local JSON analysis of model compare checklist in the AI Test Tools lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/model-compare-checklist-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "model-compare-checklist-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/model-compare-checklist-mcp"]
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
      "id": "aitest_model_compare_checklist-aitest-1",
      "name": "aitest primary",
      "category": "aitest",
      "tags": [
        "ai-test-tools",
        "model",
        "compare"
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
      "id": "aitest_model_compare_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "ai-test-tools",
        "model",
        "compare"
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
| `inventory_aitest_model_compare_checklist` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_aitest_model_compare_checklist_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_aitest_model_compare_checklist_coverage` | Show category coverage ratios and unknown categories. |
| `flag_aitest_model_compare_checklist_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_aitest_model_compare_checklist_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_aitest_model_compare_checklist_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_aitest_model_compare_checklist_baseline` | Compare category counts with the configured baseline. |
| `estimate_aitest_model_compare_checklist_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_aitest_model_compare_checklist_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_aitest_model_compare_checklist_dependencies` | Map dependency groups and show which ones are missing. |
| `test_aitest_model_compare_checklist_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_aitest_model_compare_checklist_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_aitest_model_compare_checklist_fixes` | Rank fixes by impact divided by effort. |
| `validate_aitest_model_compare_checklist_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_aitest_model_compare_checklist_duplicates` | Group items with the same category and normalized name. |
| `measure_aitest_model_compare_checklist_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_aitest_model_compare_checklist_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_aitest_model_compare_checklist_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_aitest_model_compare_checklist_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_aitest_model_compare_checklist_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_aitest_model_compare_checklist_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_aitest_model_compare_checklist_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_aitest_model_compare_checklist_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_aitest_model_compare_checklist_next_steps` | Recommend the next five actions with quick wins. |
| `open_aitest_model_compare_checklist_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
