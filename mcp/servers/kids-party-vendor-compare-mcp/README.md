# Kids Party Vendor Compare Audit

Kids Party Vendor Compare Audit: bounce magician and venue quote compare. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/kids-party-vendor-compare-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "kids-party-vendor-compare-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/kids-party-vendor-compare-mcp"]
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
      "id": "party_vendor-sample-1",
      "name": "Sample bounce entry",
      "category": "bounce",
      "tags": [
        "party"
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
      "id": "party_vendor-sample-2",
      "name": "Sample magic entry",
      "category": "magic",
      "tags": [
        "party"
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
| `inventory_party_vendor` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_party_vendor_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_party_vendor_coverage` | Show category coverage ratios and unknown categories. |
| `flag_party_vendor_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_party_vendor_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_party_vendor_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_party_vendor_baseline` | Compare category counts with the configured baseline. |
| `estimate_party_vendor_cost_per_use` | Calculate the primary metric for every item with mean and pass count. |
| `find_party_vendor_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_party_vendor_dependencies` | Map dependency groups and show which ones are missing. |
| `test_party_vendor_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_party_vendor_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_party_vendor_fixes` | Rank fixes by impact divided by effort. |
| `validate_party_vendor_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_party_vendor_duplicates` | Group items with the same category and normalized name. |
| `measure_party_vendor_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_party_vendor_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_party_vendor_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_party_vendor_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_party_vendor_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_party_vendor_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_party_vendor_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_party_vendor_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_party_vendor_next_steps` | Recommend the next five actions with quick wins. |
| `open_party_vendor_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
