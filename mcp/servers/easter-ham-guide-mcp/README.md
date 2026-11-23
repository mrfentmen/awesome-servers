# Easter Ham Guide Archive

Real local JSON analysis of easter ham guide in the Easter Ham lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/easter-ham-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "easter-ham-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/easter-ham-guide-mcp"]
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
      "id": "easter_ham_easter_ham_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "easter-ham",
        "easter",
        "ham"
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
      "id": "easter_ham_easter_ham_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "easter-ham",
        "easter",
        "ham"
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
| `inventory_easter_ham_easter_ham_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_easter_ham_easter_ham_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_easter_ham_easter_ham_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_easter_ham_easter_ham_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_easter_ham_easter_ham_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_easter_ham_easter_ham_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_easter_ham_easter_ham_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_easter_ham_easter_ham_guide_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_easter_ham_easter_ham_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_easter_ham_easter_ham_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_easter_ham_easter_ham_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_easter_ham_easter_ham_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_easter_ham_easter_ham_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_easter_ham_easter_ham_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_easter_ham_easter_ham_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_easter_ham_easter_ham_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_easter_ham_easter_ham_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_easter_ham_easter_ham_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_easter_ham_easter_ham_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_easter_ham_easter_ham_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_easter_ham_easter_ham_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_easter_ham_easter_ham_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_easter_ham_easter_ham_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_easter_ham_easter_ham_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_easter_ham_easter_ham_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
