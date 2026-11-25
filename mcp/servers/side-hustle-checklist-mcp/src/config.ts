import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "side-hustle-checklist-mcp",
  "title": "side-hustle checklist Checklist",
  "description": "Real local JSON analysis of side-hustle checklist in the Personal Finance lane. 25 MCP tools, no paywall.",
  "prefix": "finance_side_hustle_checklist",
  "entity": "side-hustle checklist item",
  "categories": [
    {
      "id": "finance",
      "label": "finance",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "side-hustle",
      "label": "side-hustle",
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
      "id": "finance_side_hustle_checklist-finance-1",
      "name": "finance primary",
      "category": "finance",
      "tags": [
        "personal-finance",
        "side",
        "hustle"
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
      "id": "finance_side_hustle_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "personal-finance",
        "side",
        "hustle"
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
      "id": "finance_side_hustle_checklist-side-hustle-3",
      "name": "side-hustle primary",
      "category": "side-hustle",
      "tags": [
        "personal-finance",
        "side",
        "hustle"
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
      "id": "finance_side_hustle_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "personal-finance",
        "side",
        "hustle"
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
      "id": "finance_side_hustle_checklist-finance-5",
      "name": "finance backup",
      "category": "finance",
      "tags": [
        "personal-finance",
        "side",
        "hustle"
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
      "id": "finance_side_hustle_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "personal-finance",
        "side",
        "hustle"
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
      "id": "finance_side_hustle_checklist-side-hustle-7",
      "name": "side-hustle backup",
      "category": "side-hustle",
      "tags": [
        "personal-finance",
        "side",
        "hustle"
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
      "id": "finance_side_hustle_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "personal-finance",
        "side",
        "hustle"
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
