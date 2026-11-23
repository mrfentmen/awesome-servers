# Bose Sound Picker Tracker

Real local JSON analysis of bose sound picker in the Bose Sound lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/bose-sound-picker-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "bose-sound-picker-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/bose-sound-picker-mcp"]
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
      "id": "bose_sound_bose_sound_picker-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "bose-sound",
        "bose",
        "sound"
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
      "id": "bose_sound_bose_sound_picker-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "bose-sound",
        "bose",
        "sound"
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
| `inventory_bose_sound_bose_sound_picker` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_bose_sound_bose_sound_picker_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_bose_sound_bose_sound_picker_coverage` | Show category coverage ratios and unknown categories. |
| `flag_bose_sound_bose_sound_picker_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_bose_sound_bose_sound_picker_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_bose_sound_bose_sound_picker_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_bose_sound_bose_sound_picker_baseline` | Compare category counts with the configured baseline. |
| `estimate_bose_sound_bose_sound_picker_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_bose_sound_bose_sound_picker_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_bose_sound_bose_sound_picker_dependencies` | Map dependency groups and show which ones are missing. |
| `test_bose_sound_bose_sound_picker_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_bose_sound_bose_sound_picker_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_bose_sound_bose_sound_picker_fixes` | Rank fixes by impact divided by effort. |
| `validate_bose_sound_bose_sound_picker_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_bose_sound_bose_sound_picker_duplicates` | Group items with the same category and normalized name. |
| `measure_bose_sound_bose_sound_picker_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_bose_sound_bose_sound_picker_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_bose_sound_bose_sound_picker_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_bose_sound_bose_sound_picker_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_bose_sound_bose_sound_picker_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_bose_sound_bose_sound_picker_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_bose_sound_bose_sound_picker_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_bose_sound_bose_sound_picker_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_bose_sound_bose_sound_picker_next_steps` | Recommend the next five actions with quick wins. |
| `open_bose_sound_bose_sound_picker_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
