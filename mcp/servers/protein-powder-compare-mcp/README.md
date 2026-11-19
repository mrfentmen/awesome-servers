# Protein Powder Compare Audit

Protein Powder Compare Audit: compare powder labels and cost per serving. Real local JSON analysis, 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/protein-powder-compare-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "protein-powder-compare-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/protein-powder-compare-mcp"]
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
      "id": "protein_powder-sample-1",
      "name": "Sample whey entry",
      "category": "whey",
      "tags": [
        "protein"
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
      "id": "protein_powder-sample-2",
      "name": "Sample plant entry",
      "category": "plant",
      "tags": [
        "protein"
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
| `inventory_protein_powder` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_protein_powder_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_protein_powder_coverage` | Show category coverage ratios and unknown categories. |
| `flag_protein_powder_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_protein_powder_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_protein_powder_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_protein_powder_baseline` | Compare category counts with the configured baseline. |
| `estimate_protein_powder_cost_per_use` | Calculate the primary metric for every item with mean and pass count. |
| `find_protein_powder_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_protein_powder_dependencies` | Map dependency groups and show which ones are missing. |
| `test_protein_powder_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_protein_powder_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_protein_powder_fixes` | Rank fixes by impact divided by effort. |
| `validate_protein_powder_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_protein_powder_duplicates` | Group items with the same category and normalized name. |
| `measure_protein_powder_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_protein_powder_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_protein_powder_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_protein_powder_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_protein_powder_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_protein_powder_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_protein_powder_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_protein_powder_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_protein_powder_next_steps` | Recommend the next five actions with quick wins. |
| `open_protein_powder_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
