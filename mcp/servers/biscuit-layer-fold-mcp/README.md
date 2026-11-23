# Biscuit Layer Fold Tracker

Real local JSON analysis of biscuit layer fold in the Bake Lab lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/biscuit-layer-fold-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "biscuit-layer-fold-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/biscuit-layer-fold-mcp"]
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
      "id": "bake_lab_biscuit_layer_fold-steps-1",
      "name": "Steps primary",
      "category": "steps",
      "tags": [
        "bake-lab",
        "biscuit",
        "layer"
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
      "id": "bake_lab_biscuit_layer_fold-tools-2",
      "name": "Tools primary",
      "category": "tools",
      "tags": [
        "bake-lab",
        "biscuit",
        "layer"
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
| `inventory_bake_lab_biscuit_layer_fold` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_bake_lab_biscuit_layer_fold_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_bake_lab_biscuit_layer_fold_coverage` | Show category coverage ratios and unknown categories. |
| `flag_bake_lab_biscuit_layer_fold_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_bake_lab_biscuit_layer_fold_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_bake_lab_biscuit_layer_fold_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_bake_lab_biscuit_layer_fold_baseline` | Compare category counts with the configured baseline. |
| `estimate_bake_lab_biscuit_layer_fold_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_bake_lab_biscuit_layer_fold_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_bake_lab_biscuit_layer_fold_dependencies` | Map dependency groups and show which ones are missing. |
| `test_bake_lab_biscuit_layer_fold_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_bake_lab_biscuit_layer_fold_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_bake_lab_biscuit_layer_fold_fixes` | Rank fixes by impact divided by effort. |
| `validate_bake_lab_biscuit_layer_fold_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_bake_lab_biscuit_layer_fold_duplicates` | Group items with the same category and normalized name. |
| `measure_bake_lab_biscuit_layer_fold_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_bake_lab_biscuit_layer_fold_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_bake_lab_biscuit_layer_fold_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_bake_lab_biscuit_layer_fold_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_bake_lab_biscuit_layer_fold_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_bake_lab_biscuit_layer_fold_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_bake_lab_biscuit_layer_fold_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_bake_lab_biscuit_layer_fold_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_bake_lab_biscuit_layer_fold_next_steps` | Recommend the next five actions with quick wins. |
| `open_bake_lab_biscuit_layer_fold_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
