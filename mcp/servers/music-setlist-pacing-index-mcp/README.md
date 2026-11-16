# Setlist Pacing Archive

Archive setlist pacing by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/music-setlist-pacing-index-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "music-setlist-pacing-index-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/music-setlist-pacing-index-mcp"]
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
      "id": "setlist_pacing_index-open",
      "name": "Opening anthem",
      "category": "opener",
      "tags": [
        "fast",
        "familiar"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "setlist_pacing_index-second",
      "name": "Second song",
      "category": "opener",
      "tags": [
        "mid-tempo",
        "single"
      ],
      "cost": 0,
      "quantity": 7,
      "condition": "good"
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_setlist_pacing_index` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_setlist_pacing_index_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_setlist_pacing_index_coverage` | Show category coverage ratios and unknown categories. |
| `flag_setlist_pacing_index_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_setlist_pacing_index_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_setlist_pacing_index_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_setlist_pacing_index_baseline` | Compare category counts with the configured baseline. |
| `estimate_setlist_pacing_index_energy_score` | Calculate the primary metric for every item with mean and pass count. |
| `find_setlist_pacing_index_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_setlist_pacing_index_dependencies` | Map dependency groups and show which ones are missing. |
| `test_setlist_pacing_index_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_setlist_pacing_index_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_setlist_pacing_index_fixes` | Rank fixes by impact divided by effort. |
| `validate_setlist_pacing_index_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_setlist_pacing_index_duplicates` | Group items with the same category and normalized name. |
| `measure_setlist_pacing_index_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_setlist_pacing_index_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_setlist_pacing_index_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_setlist_pacing_index_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_setlist_pacing_index_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_setlist_pacing_index_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_setlist_pacing_index_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_setlist_pacing_index_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_setlist_pacing_index_next_steps` | Recommend the next five actions with quick wins. |
| `open_setlist_pacing_index_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
