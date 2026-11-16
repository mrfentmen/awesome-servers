# Patch Test Audit

Audit patch test by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/skincare-patch-test-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "skincare-patch-test-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/skincare-patch-test-check-mcp"]
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
      "id": "patch_test-serum",
      "name": "New serum",
      "category": "face",
      "tags": [
        "fragrance-free",
        "night"
      ],
      "cost": 35,
      "quantity": 24,
      "condition": "good"
    },
    {
      "id": "patch_test-cleanser",
      "name": "New cleanser",
      "category": "face",
      "tags": [
        "gentle",
        "daily"
      ],
      "cost": 22,
      "quantity": 24,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_patch_test` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_patch_test_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_patch_test_coverage` | Show category coverage ratios and unknown categories. |
| `flag_patch_test_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_patch_test_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_patch_test_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_patch_test_baseline` | Compare category counts with the configured baseline. |
| `estimate_patch_test_patch_hours` | Calculate the primary metric for every item with mean and pass count. |
| `find_patch_test_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_patch_test_dependencies` | Map dependency groups and show which ones are missing. |
| `test_patch_test_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_patch_test_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_patch_test_fixes` | Rank fixes by impact divided by effort. |
| `validate_patch_test_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_patch_test_duplicates` | Group items with the same category and normalized name. |
| `measure_patch_test_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_patch_test_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_patch_test_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_patch_test_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_patch_test_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_patch_test_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_patch_test_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_patch_test_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_patch_test_next_steps` | Recommend the next five actions with quick wins. |
| `open_patch_test_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
