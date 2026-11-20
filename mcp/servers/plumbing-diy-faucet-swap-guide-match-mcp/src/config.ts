import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "plumbing-diy-faucet-swap-guide-match-mcp",
  "title": "Faucet Swap Guide Matcher",
  "description": "Real local JSON analysis of faucet swap guide in the DIY Plumbing lane. 25 MCP tools, no paywall.",
  "prefix": "plumbing_diy_plumbing_diy_faucet_swap_guide_match",
  "entity": "faucet swap guide item",
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
      "id": "plumbing_diy_plumbing_diy_faucet_swap_guide_match-criteria-1",
      "name": "Criteria primary",
      "category": "criteria",
      "tags": [
        "diy-plumbing",
        "plumbing",
        "diy"
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
      "id": "plumbing_diy_plumbing_diy_faucet_swap_guide_match-candidates-2",
      "name": "Candidates primary",
      "category": "candidates",
      "tags": [
        "diy-plumbing",
        "plumbing",
        "diy"
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
      "id": "plumbing_diy_plumbing_diy_faucet_swap_guide_match-scores-3",
      "name": "Scores primary",
      "category": "scores",
      "tags": [
        "diy-plumbing",
        "plumbing",
        "diy"
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
      "id": "plumbing_diy_plumbing_diy_faucet_swap_guide_match-shortlist-4",
      "name": "Shortlist primary",
      "category": "shortlist",
      "tags": [
        "diy-plumbing",
        "plumbing",
        "diy"
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
      "id": "plumbing_diy_plumbing_diy_faucet_swap_guide_match-criteria-5",
      "name": "Criteria backup",
      "category": "criteria",
      "tags": [
        "diy-plumbing",
        "plumbing",
        "diy"
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
      "id": "plumbing_diy_plumbing_diy_faucet_swap_guide_match-candidates-6",
      "name": "Candidates backup",
      "category": "candidates",
      "tags": [
        "diy-plumbing",
        "plumbing",
        "diy"
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
      "id": "plumbing_diy_plumbing_diy_faucet_swap_guide_match-scores-7",
      "name": "Scores backup",
      "category": "scores",
      "tags": [
        "diy-plumbing",
        "plumbing",
        "diy"
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
      "id": "plumbing_diy_plumbing_diy_faucet_swap_guide_match-shortlist-8",
      "name": "Shortlist backup",
      "category": "shortlist",
      "tags": [
        "diy-plumbing",
        "plumbing",
        "diy"
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
