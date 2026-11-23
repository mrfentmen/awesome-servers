# Salary Negotiate Script Guide

Real local JSON analysis of salary negotiate script in the Career Ladder lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/salary-negotiate-script-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "salary-negotiate-script-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/salary-negotiate-script-mcp"]
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
      "id": "career_ladder_salary_negotiate_script-steps-1",
      "name": "Steps primary",
      "category": "steps",
      "tags": [
        "career-ladder",
        "salary",
        "negotiate"
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
      "id": "career_ladder_salary_negotiate_script-tools-2",
      "name": "Tools primary",
      "category": "tools",
      "tags": [
        "career-ladder",
        "salary",
        "negotiate"
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
| `inventory_career_ladder_salary_negotiate_script` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_career_ladder_salary_negotiate_script_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_career_ladder_salary_negotiate_script_coverage` | Show category coverage ratios and unknown categories. |
| `flag_career_ladder_salary_negotiate_script_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_career_ladder_salary_negotiate_script_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_career_ladder_salary_negotiate_script_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_career_ladder_salary_negotiate_script_baseline` | Compare category counts with the configured baseline. |
| `estimate_career_ladder_salary_negotiate_script_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_career_ladder_salary_negotiate_script_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_career_ladder_salary_negotiate_script_dependencies` | Map dependency groups and show which ones are missing. |
| `test_career_ladder_salary_negotiate_script_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_career_ladder_salary_negotiate_script_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_career_ladder_salary_negotiate_script_fixes` | Rank fixes by impact divided by effort. |
| `validate_career_ladder_salary_negotiate_script_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_career_ladder_salary_negotiate_script_duplicates` | Group items with the same category and normalized name. |
| `measure_career_ladder_salary_negotiate_script_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_career_ladder_salary_negotiate_script_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_career_ladder_salary_negotiate_script_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_career_ladder_salary_negotiate_script_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_career_ladder_salary_negotiate_script_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_career_ladder_salary_negotiate_script_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_career_ladder_salary_negotiate_script_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_career_ladder_salary_negotiate_script_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_career_ladder_salary_negotiate_script_next_steps` | Recommend the next five actions with quick wins. |
| `open_career_ladder_salary_negotiate_script_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
