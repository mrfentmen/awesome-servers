# Acoustic Panel Place Tracker

Real local JSON analysis of acoustic panel place in the Listening Room lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/acoustic-panel-place-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "acoustic-panel-place-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/acoustic-panel-place-mcp"]
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
      "id": "listening_room_acoustic_panel_place-steps-1",
      "name": "Steps primary",
      "category": "steps",
      "tags": [
        "listening-room",
        "acoustic",
        "panel"
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
      "id": "listening_room_acoustic_panel_place-tools-2",
      "name": "Tools primary",
      "category": "tools",
      "tags": [
        "listening-room",
        "acoustic",
        "panel"
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
| `inventory_listening_room_acoustic_panel_place` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_listening_room_acoustic_panel_place_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_listening_room_acoustic_panel_place_coverage` | Show category coverage ratios and unknown categories. |
| `flag_listening_room_acoustic_panel_place_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_listening_room_acoustic_panel_place_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_listening_room_acoustic_panel_place_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_listening_room_acoustic_panel_place_baseline` | Compare category counts with the configured baseline. |
| `estimate_listening_room_acoustic_panel_place_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_listening_room_acoustic_panel_place_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_listening_room_acoustic_panel_place_dependencies` | Map dependency groups and show which ones are missing. |
| `test_listening_room_acoustic_panel_place_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_listening_room_acoustic_panel_place_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_listening_room_acoustic_panel_place_fixes` | Rank fixes by impact divided by effort. |
| `validate_listening_room_acoustic_panel_place_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_listening_room_acoustic_panel_place_duplicates` | Group items with the same category and normalized name. |
| `measure_listening_room_acoustic_panel_place_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_listening_room_acoustic_panel_place_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_listening_room_acoustic_panel_place_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_listening_room_acoustic_panel_place_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_listening_room_acoustic_panel_place_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_listening_room_acoustic_panel_place_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_listening_room_acoustic_panel_place_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_listening_room_acoustic_panel_place_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_listening_room_acoustic_panel_place_next_steps` | Recommend the next five actions with quick wins. |
| `open_listening_room_acoustic_panel_place_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
