# Rule Teach Script Audit

Real local JSON analysis of rule teach script in the Board Games lane. 25 MCP tools, no paywall.

## Install

```bash
npm install -g @mrfentmen/board-games-rule-teach-script-check-mcp
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "board-games-rule-teach-script-check-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/board-games-rule-teach-script-check-mcp"]
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
      "id": "board_games_board_games_rule_teach_script_check-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "board-games",
        "board",
        "games"
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
      "id": "board_games_board_games_rule_teach_script_check-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "board-games",
        "board",
        "games"
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
| `inventory_board_games_board_games_rule_teach_script_check` | Count items by category and show spend, quantity, freshness and the primary metric. |
| `score_board_games_board_games_rule_teach_script_check_readiness` | Score readiness from 0 to 100 with coverage, condition, data and metric components. |
| `audit_board_games_board_games_rule_teach_script_check_coverage` | Show category coverage ratios and unknown categories. |
| `flag_board_games_board_games_rule_teach_script_check_gaps` | List missing categories, expired items, expiring items and dependency gaps. |
| `rank_board_games_board_games_rule_teach_script_check_risks` | Rank coverage, expiry, budget, duplicate, condition and data risks. |
| `check_board_games_board_games_rule_teach_script_check_constraints` | Check item cap, budget, coverage, expiry and metric targets. |
| `compare_board_games_board_games_rule_teach_script_check_baseline` | Compare category counts with the configured baseline. |
| `estimate_board_games_board_games_rule_teach_script_check_service_gap` | Calculate the primary metric for every item with mean and pass count. |
| `find_board_games_board_games_rule_teach_script_check_quick_wins` | Find low-effort fixes from small gaps, missing data, expiry and duplicates. |
| `map_board_games_board_games_rule_teach_script_check_dependencies` | Map dependency groups and show which ones are missing. |
| `test_board_games_board_games_rule_teach_script_check_edge_cases` | Test empty, single-item, duplicate-id, zero-cost, expiry and unknown-category cases. |
| `summarize_board_games_board_games_rule_teach_script_check_findings` | Summarize counts, top gaps, top risks and data issues. |
| `prioritize_board_games_board_games_rule_teach_script_check_fixes` | Rank fixes by impact divided by effort. |
| `validate_board_games_board_games_rule_teach_script_check_inputs` | Validate arbitrary JSON and report schema errors and warnings. |
| `detect_board_games_board_games_rule_teach_script_check_duplicates` | Group items with the same category and normalized name. |
| `measure_board_games_board_games_rule_teach_script_check_variance` | Measure metric spread, category variance and tag diversity. |
| `benchmark_board_games_board_games_rule_teach_script_check_options` | Benchmark lean, balanced and full sizes against readiness and data targets. |
| `explain_board_games_board_games_rule_teach_script_check_tradeoffs` | Explain size, cost, freshness and data-quality tradeoffs. |
| `draft_board_games_board_games_rule_teach_script_check_checklist` | Draft a checklist from gaps, high risks, missing data and budget. |
| `export_board_games_board_games_rule_teach_script_check_audit` | Export the full audit with metrics, gaps, risks, constraints and next steps. |
| `track_board_games_board_games_rule_teach_script_check_changes` | Compare two snapshots by item id and list added, removed and changed items. |
| `review_board_games_board_games_rule_teach_script_check_history` | Review dated snapshots and show readiness, cost and metric trends. |
| `score_board_games_board_games_rule_teach_script_check_confidence` | Score trust from data completeness, item count and field coverage. |
| `recommend_board_games_board_games_rule_teach_script_check_next_steps` | Recommend the next five actions with quick wins. |
| `open_board_games_board_games_rule_teach_script_check_questions` | List open questions that block a better audit. |

## Rules

- Local computation only. No network calls, no telemetry, no paywall.
- Missing dates, costs and quantities are reported, not invented.
- Dates use `YYYY-MM-DD`.
- MIT licence.
