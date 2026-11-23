# Gas Can Stabilizer Matcher

Real local JSON analysis of gas can stabilizer in the Gas Can lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/gas-can-stabilizer-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "gas-can-stabilizer-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/gas-can-stabilizer-mcp"]
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
      "id": "gas_can_gas_can_stabilizer-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "gas-can",
        "gas",
        "can"
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
      "id": "gas_can_gas_can_stabilizer-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "gas-can",
        "gas",
        "can"
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
| `inventory_gas_can_gas_can_stabilizer` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_gas_can_gas_can_stabilizer_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_gas_can_gas_can_stabilizer_coverage` | Show category coverage ratios and unknown categories. |
| `flag_gas_can_gas_can_stabilizer_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_gas_can_gas_can_stabilizer_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_gas_can_gas_can_stabilizer_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_gas_can_gas_can_stabilizer_baseline` | Compare category counts with the configured baseline. |
| `estimate_gas_can_gas_can_stabilizer_clearance_risk` | Calculate the primary metric for every item with mean and pass count. |
| `find_gas_can_gas_can_stabilizer_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_gas_can_gas_can_stabilizer_dependencies` | Map dependency groups and show which ones are missing. |
| `test_gas_can_gas_can_stabilizer_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_gas_can_gas_can_stabilizer_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_gas_can_gas_can_stabilizer_fixes` | Rank fixes by impact divided by effort. |
| `validate_gas_can_gas_can_stabilizer_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_gas_can_gas_can_stabilizer_duplicates` | Group items with the same category and normalized name. |
| `measure_gas_can_gas_can_stabilizer_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_gas_can_gas_can_stabilizer_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_gas_can_gas_can_stabilizer_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_gas_can_gas_can_stabilizer_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_gas_can_gas_can_stabilizer_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_gas_can_gas_can_stabilizer_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_gas_can_gas_can_stabilizer_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_gas_can_gas_can_stabilizer_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_gas_can_gas_can_stabilizer_next_steps` | Recommend the next five actions with quick wins. |
| `open_gas_can_gas_can_stabilizer_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
