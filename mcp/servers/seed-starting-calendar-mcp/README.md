# Seed Starting Calendar Audit

Real local JSON analysis of seed starting calendar in the Garden Beds lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/seed-starting-calendar-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "seed-starting-calendar-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/seed-starting-calendar-mcp"]
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
      "id": "garden_beds_seed_starting_calendar-models-1",
      "name": "Models primary",
      "category": "models",
      "tags": [
        "garden-beds",
        "seed",
        "starting"
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
      "id": "garden_beds_seed_starting_calendar-prices-2",
      "name": "Prices primary",
      "category": "prices",
      "tags": [
        "garden-beds",
        "seed",
        "starting"
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
| `inventory_garden_beds_seed_starting_calendar` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_garden_beds_seed_starting_calendar_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_garden_beds_seed_starting_calendar_coverage` | Show category coverage ratios and unknown categories. |
| `flag_garden_beds_seed_starting_calendar_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_garden_beds_seed_starting_calendar_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_garden_beds_seed_starting_calendar_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_garden_beds_seed_starting_calendar_baseline` | Compare category counts with the configured baseline. |
| `estimate_garden_beds_seed_starting_calendar_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_garden_beds_seed_starting_calendar_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_garden_beds_seed_starting_calendar_dependencies` | Map dependency groups and show which ones are missing. |
| `test_garden_beds_seed_starting_calendar_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_garden_beds_seed_starting_calendar_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_garden_beds_seed_starting_calendar_fixes` | Rank fixes by impact divided by effort. |
| `validate_garden_beds_seed_starting_calendar_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_garden_beds_seed_starting_calendar_duplicates` | Group items with the same category and normalized name. |
| `measure_garden_beds_seed_starting_calendar_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_garden_beds_seed_starting_calendar_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_garden_beds_seed_starting_calendar_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_garden_beds_seed_starting_calendar_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_garden_beds_seed_starting_calendar_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_garden_beds_seed_starting_calendar_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_garden_beds_seed_starting_calendar_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_garden_beds_seed_starting_calendar_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_garden_beds_seed_starting_calendar_next_steps` | Recommend the next five actions with quick wins. |
| `open_garden_beds_seed_starting_calendar_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
