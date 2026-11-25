# dog training compare Compare

Real local JSON analysis of dog training compare in the Pets & Animals lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/dog-training-compare-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "dog-training-compare-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/dog-training-compare-mcp"]
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
      "id": "pets_dog_training_compare-pets-1",
      "name": "pets primary",
      "category": "pets",
      "tags": [
        "pets-animals",
        "dog",
        "training"
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
      "id": "pets_dog_training_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "pets-animals",
        "dog",
        "training"
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
| `inventory_pets_dog_training_compare` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_pets_dog_training_compare_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_pets_dog_training_compare_coverage` | Show category coverage ratios and unknown categories. |
| `flag_pets_dog_training_compare_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_pets_dog_training_compare_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_pets_dog_training_compare_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_pets_dog_training_compare_baseline` | Compare category counts with the configured baseline. |
| `estimate_pets_dog_training_compare_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_pets_dog_training_compare_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_pets_dog_training_compare_dependencies` | Map dependency groups and show which ones are missing. |
| `test_pets_dog_training_compare_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_pets_dog_training_compare_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_pets_dog_training_compare_fixes` | Rank fixes by impact divided by effort. |
| `validate_pets_dog_training_compare_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_pets_dog_training_compare_duplicates` | Group items with the same category and normalized name. |
| `measure_pets_dog_training_compare_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_pets_dog_training_compare_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_pets_dog_training_compare_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_pets_dog_training_compare_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_pets_dog_training_compare_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_pets_dog_training_compare_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_pets_dog_training_compare_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_pets_dog_training_compare_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_pets_dog_training_compare_next_steps` | Recommend the next five actions with quick wins. |
| `open_pets_dog_training_compare_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
