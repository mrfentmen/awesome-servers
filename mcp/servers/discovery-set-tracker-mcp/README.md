# discovery set tracker Tracker

Real local JSON analysis of discovery set tracker in the Legal & Compliance Ops lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/discovery-set-tracker-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "discovery-set-tracker-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/discovery-set-tracker-mcp"]
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
      "id": "legalops_discovery_set_tracker-legalops-1",
      "name": "legalops primary",
      "category": "legalops",
      "tags": [
        "legal-compliance-ops",
        "discovery",
        "set"
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
      "id": "legalops_discovery_set_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "legal-compliance-ops",
        "discovery",
        "set"
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
| `inventory_legalops_discovery_set_tracker` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_legalops_discovery_set_tracker_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_legalops_discovery_set_tracker_coverage` | Show category coverage ratios and unknown categories. |
| `flag_legalops_discovery_set_tracker_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_legalops_discovery_set_tracker_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_legalops_discovery_set_tracker_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_legalops_discovery_set_tracker_baseline` | Compare category counts with the configured baseline. |
| `estimate_legalops_discovery_set_tracker_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_legalops_discovery_set_tracker_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_legalops_discovery_set_tracker_dependencies` | Map dependency groups and show which ones are missing. |
| `test_legalops_discovery_set_tracker_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_legalops_discovery_set_tracker_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_legalops_discovery_set_tracker_fixes` | Rank fixes by impact divided by effort. |
| `validate_legalops_discovery_set_tracker_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_legalops_discovery_set_tracker_duplicates` | Group items with the same category and normalized name. |
| `measure_legalops_discovery_set_tracker_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_legalops_discovery_set_tracker_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_legalops_discovery_set_tracker_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_legalops_discovery_set_tracker_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_legalops_discovery_set_tracker_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_legalops_discovery_set_tracker_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_legalops_discovery_set_tracker_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_legalops_discovery_set_tracker_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_legalops_discovery_set_tracker_next_steps` | Recommend the next five actions with quick wins. |
| `open_legalops_discovery_set_tracker_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
