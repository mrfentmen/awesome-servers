# Hp Printer Ink Tracker

Real local JSON analysis of hp printer ink in the Hp Printer lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/hp-printer-ink-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "hp-printer-ink-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/hp-printer-ink-mcp"]
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
      "id": "hp_printer_hp_printer_ink-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "hp-printer",
        "hp",
        "printer"
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
      "id": "hp_printer_hp_printer_ink-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "hp-printer",
        "hp",
        "printer"
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
| `inventory_hp_printer_hp_printer_ink` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_hp_printer_hp_printer_ink_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_hp_printer_hp_printer_ink_coverage` | Show category coverage ratios and unknown categories. |
| `flag_hp_printer_hp_printer_ink_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_hp_printer_hp_printer_ink_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_hp_printer_hp_printer_ink_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_hp_printer_hp_printer_ink_baseline` | Compare category counts with the configured baseline. |
| `estimate_hp_printer_hp_printer_ink_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_hp_printer_hp_printer_ink_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_hp_printer_hp_printer_ink_dependencies` | Map dependency groups and show which ones are missing. |
| `test_hp_printer_hp_printer_ink_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_hp_printer_hp_printer_ink_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_hp_printer_hp_printer_ink_fixes` | Rank fixes by impact divided by effort. |
| `validate_hp_printer_hp_printer_ink_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_hp_printer_hp_printer_ink_duplicates` | Group items with the same category and normalized name. |
| `measure_hp_printer_hp_printer_ink_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_hp_printer_hp_printer_ink_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_hp_printer_hp_printer_ink_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_hp_printer_hp_printer_ink_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_hp_printer_hp_printer_ink_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_hp_printer_hp_printer_ink_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_hp_printer_hp_printer_ink_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_hp_printer_hp_printer_ink_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_hp_printer_hp_printer_ink_next_steps` | Recommend the next five actions with quick wins. |
| `open_hp_printer_hp_printer_ink_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
