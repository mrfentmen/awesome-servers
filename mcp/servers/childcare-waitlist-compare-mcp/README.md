# Childcare Waitlist Compare Audit

Childcare Waitlist Compare Audit: compare provider waitlists deposits and terms. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/childcare-waitlist-compare-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "childcare-waitlist-compare-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/childcare-waitlist-compare-mcp"]
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
      "id": "childcare_wl-sample-1",
      "name": "Sample centers entry",
      "category": "center",
      "tags": [
        "childcare"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "childcare_wl-sample-2",
      "name": "Sample home care entry",
      "category": "home",
      "tags": [
        "childcare"
      ],
      "cost": 30,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
```

## Tools (25)

| Tool | What it does |
| --- | --- |
| `inventory_childcare_wl` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_childcare_wl_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_childcare_wl_coverage` | Show category coverage ratios and unknown categories. |
| `flag_childcare_wl_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_childcare_wl_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_childcare_wl_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_childcare_wl_baseline` | Compare category counts with the configured baseline. |
| `estimate_childcare_wl_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_childcare_wl_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_childcare_wl_dependencies` | Map dependency groups and show which ones are missing. |
| `test_childcare_wl_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_childcare_wl_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_childcare_wl_fixes` | Rank fixes by impact divided by effort. |
| `validate_childcare_wl_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_childcare_wl_duplicates` | Group items with the same category and normalized name. |
| `measure_childcare_wl_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_childcare_wl_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_childcare_wl_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_childcare_wl_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_childcare_wl_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_childcare_wl_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_childcare_wl_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_childcare_wl_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_childcare_wl_next_steps` | Recommend the next five actions with quick wins. |
| `open_childcare_wl_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
