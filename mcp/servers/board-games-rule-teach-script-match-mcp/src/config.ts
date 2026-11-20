import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "board-games-rule-teach-script-match-mcp",
  "title": "Rule Teach Script Matcher",
  "description": "Real local JSON analysis of rule teach script in the Board Games lane. 25 MCP tools, no paywall.",
  "prefix": "board_games_board_games_rule_teach_script_match",
  "entity": "rule teach script item",
  "categories": [
    {
      "id": "criteria",
      "label": "Criteria",
      "baseline": 2
    },
    {
      "id": "candidates",
      "label": "Candidates",
      "baseline": 2
    },
    {
      "id": "scores",
      "label": "Scores",
      "baseline": 2
    },
    {
      "id": "shortlist",
      "label": "Shortlist",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "clearance_risk",
    "label": "Claim risk",
    "unit": "score",
    "target": 0,
    "direction": "lower"
  },
  "target": {
    "maxItems": 30,
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "criteria"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "shortlist"
      ]
    }
  ],
  "sample": [
    {
      "id": "board_games_board_games_rule_teach_script_match-criteria-1",
      "name": "Criteria primary",
      "category": "criteria",
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
      "id": "board_games_board_games_rule_teach_script_match-candidates-2",
      "name": "Candidates primary",
      "category": "candidates",
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
    },
    {
      "id": "board_games_board_games_rule_teach_script_match-scores-3",
      "name": "Scores primary",
      "category": "scores",
      "tags": [
        "board-games",
        "board",
        "games"
      ],
      "cost": 50,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-12",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "board_games_board_games_rule_teach_script_match-shortlist-4",
      "name": "Shortlist primary",
      "category": "shortlist",
      "tags": [
        "board-games",
        "board",
        "games"
      ],
      "cost": 65,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-26",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "board_games_board_games_rule_teach_script_match-criteria-5",
      "name": "Criteria backup",
      "category": "criteria",
      "tags": [
        "board-games",
        "board",
        "games"
      ],
      "cost": 80,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-09",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "board_games_board_games_rule_teach_script_match-candidates-6",
      "name": "Candidates backup",
      "category": "candidates",
      "tags": [
        "board-games",
        "board",
        "games"
      ],
      "cost": 95,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-23",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "board_games_board_games_rule_teach_script_match-scores-7",
      "name": "Scores backup",
      "category": "scores",
      "tags": [
        "board-games",
        "board",
        "games"
      ],
      "cost": 110,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-09",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "board_games_board_games_rule_teach_script_match-shortlist-8",
      "name": "Shortlist backup",
      "category": "shortlist",
      "tags": [
        "board-games",
        "board",
        "games"
      ],
      "cost": 125,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-23",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
