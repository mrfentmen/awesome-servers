# GTA 6 Guide Audit

Track GTA 6 progress across characters, missions, locations, vehicles, weapons and collectibles. Real local JSON analysis, 38 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/gta-6-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "gta-6-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/gta-6-mcp"]
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
      "id": "gta6-lucia",
      "name": "Lucia Caminos",
      "category": "characters",
      "tags": [
        "vice-city",
        "protagonist"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "gta6-jason",
      "name": "Jason Duval",
      "category": "characters",
      "tags": [
        "leonida",
        "protagonist"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
```

## Tools (38)

| Tool | What it does |
| --- | --- |
| `inventory_gta6_guide` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_gta6_guide_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_gta6_guide_coverage` | Show category coverage ratios and unknown categories. |
| `flag_gta6_guide_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_gta6_guide_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_gta6_guide_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_gta6_guide_baseline` | Compare category counts with the configured baseline. |
| `estimate_gta6_guide_completion_rate` | Calculate the primary metric for every item with mean and pass count. |
| `find_gta6_guide_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_gta6_guide_dependencies` | Map dependency groups and show which ones are missing. |
| `test_gta6_guide_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_gta6_guide_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_gta6_guide_fixes` | Rank fixes by impact divided by effort. |
| `validate_gta6_guide_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_gta6_guide_duplicates` | Group items with the same category and normalized name. |
| `measure_gta6_guide_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_gta6_guide_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_gta6_guide_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_gta6_guide_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_gta6_guide_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_gta6_guide_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_gta6_guide_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_gta6_guide_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_gta6_guide_next_steps` | Recommend the next five actions with quick wins. |
| `open_gta6_guide_questions` | List open questions that block a better audit. |
| `lookup_gta6_guide_character` | Look up GTA 6 characters from the bundled guide. |
| `lookup_gta6_guide_location` | Look up GTA 6 locations from the bundled guide. |
| `lookup_gta6_guide_vehicle` | Look up GTA 6 vehicles from the bundled guide. |
| `lookup_gta6_guide_weapon` | Look up GTA 6 weapons from the bundled guide. |
| `suggest_gta6_guide_next_play` | Suggest what to play next with money and wanted-level tips. |
| `lookup_gta6_guide_mission` | Look up GTA 6 mission playbooks from the bundled guide. |
| `lookup_gta6_guide_activity` | Look up GTA 6 side activities from the bundled guide. |
| `lookup_gta6_guide_collectible` | Look up GTA 6 collectibles from the bundled guide. |
| `lookup_gta6_guide_tip` | Look up GTA 6 tips from the bundled guide. |
| `track_gta6_guide_completion` | Track guide completion percent per category and overall. |
| `compare_gta6_guide_vehicles` | Compare GTA 6 vehicles by price, stock, and condition. |
| `plan_gta6_guide_heist_prep` | Build a heist prep checklist with getaway and loadout. |
| `pick_gta6_guide_challenge` | Pick a deterministic daily challenge from activities and collectibles. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
