# Roof Rake Guide Archive

Real local JSON analysis of roof rake guide in the Roof Rake lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/roof-rake-guide-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "roof-rake-guide-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/roof-rake-guide-mcp"]
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
      "id": "roof_rake_roof_rake_guide-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "roof-rake",
        "roof",
        "rake"
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
      "id": "roof_rake_roof_rake_guide-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "roof-rake",
        "roof",
        "rake"
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
| `inventory_roof_rake_roof_rake_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_roof_rake_roof_rake_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_roof_rake_roof_rake_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_roof_rake_roof_rake_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_roof_rake_roof_rake_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_roof_rake_roof_rake_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_roof_rake_roof_rake_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_roof_rake_roof_rake_guide_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_roof_rake_roof_rake_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_roof_rake_roof_rake_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_roof_rake_roof_rake_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_roof_rake_roof_rake_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_roof_rake_roof_rake_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_roof_rake_roof_rake_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_roof_rake_roof_rake_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_roof_rake_roof_rake_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_roof_rake_roof_rake_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_roof_rake_roof_rake_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_roof_rake_roof_rake_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_roof_rake_roof_rake_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_roof_rake_roof_rake_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_roof_rake_roof_rake_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_roof_rake_roof_rake_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_roof_rake_roof_rake_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_roof_rake_roof_rake_guide_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
