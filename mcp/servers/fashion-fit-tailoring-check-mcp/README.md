# Fit and Tailoring Audit

Audit garments waiting on tailoring, alteration days, spend and fit coverage. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/fashion-fit-tailoring-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "fashion-fit-tailoring-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/fashion-fit-tailoring-check-mcp"]
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
      "id": "fit-shirt",
      "name": "Linen shirt",
      "category": "top",
      "tags": [
        "sleeves"
      ],
      "cost": 45,
      "quantity": 3,
      "acquired": "2026-10-01",
      "condition": "good"
    },
    {
      "id": "fit-trouser",
      "name": "Wool trousers",
      "category": "bottom",
      "tags": [
        "hem"
      ],
      "cost": 80,
      "quantity": 10,
      "acquired": "2026-09-01",
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_fit_tailoring` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_fit_tailoring_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_fit_tailoring_coverage` | Show category coverage ratios and unknown categories. |
| `flag_fit_tailoring_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_fit_tailoring_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_fit_tailoring_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_fit_tailoring_baseline` | Compare category counts with the configured baseline. |
| `estimate_fit_tailoring_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_fit_tailoring_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_fit_tailoring_dependencies` | Map dependency groups and show which ones are missing. |
| `test_fit_tailoring_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_fit_tailoring_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_fit_tailoring_fixes` | Rank fixes by impact divided by effort. |
| `validate_fit_tailoring_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_fit_tailoring_duplicates` | Group items with the same category and normalized name. |
| `measure_fit_tailoring_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_fit_tailoring_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_fit_tailoring_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_fit_tailoring_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_fit_tailoring_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_fit_tailoring_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_fit_tailoring_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_fit_tailoring_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_fit_tailoring_next_steps` | Recommend the next five actions with quick wins. |
| `open_fit_tailoring_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
