import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "roth-ira-compare-mcp",
  "title": "roth-ira compare Compare",
  "description": "Real local JSON analysis of roth-ira compare in the Personal Finance lane. 25 MCP tools, no paywall.",
  "prefix": "finance_roth_ira_compare",
  "entity": "roth-ira compare item",
  "categories": [
    {
      "id": "finance",
      "label": "finance",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "roth-ira",
      "label": "roth-ira",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since review",
    "unit": "days",
    "target": 14,
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
        "finance"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "mcp"
      ]
    }
  ],
  "sample": [
    {
      "id": "finance_roth_ira_compare-finance-1",
      "name": "finance primary",
      "category": "finance",
      "tags": [
        "personal-finance",
        "roth",
        "ira"
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
      "id": "finance_roth_ira_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "personal-finance",
        "roth",
        "ira"
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
      "id": "finance_roth_ira_compare-roth-ira-3",
      "name": "roth-ira primary",
      "category": "roth-ira",
      "tags": [
        "personal-finance",
        "roth",
        "ira"
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
      "id": "finance_roth_ira_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "personal-finance",
        "roth",
        "ira"
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
      "id": "finance_roth_ira_compare-finance-5",
      "name": "finance backup",
      "category": "finance",
      "tags": [
        "personal-finance",
        "roth",
        "ira"
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
      "id": "finance_roth_ira_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "personal-finance",
        "roth",
        "ira"
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
      "id": "finance_roth_ira_compare-roth-ira-7",
      "name": "roth-ira backup",
      "category": "roth-ira",
      "tags": [
        "personal-finance",
        "roth",
        "ira"
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
      "id": "finance_roth_ira_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "personal-finance",
        "roth",
        "ira"
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
