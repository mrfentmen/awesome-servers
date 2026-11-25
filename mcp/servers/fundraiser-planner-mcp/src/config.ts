import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fundraiser-planner-mcp",
  "title": "fundraiser planner Planner",
  "description": "Real local JSON analysis of fundraiser planner in the Nonprofits & Community lane. 25 MCP tools, no paywall.",
  "prefix": "nonprofit_fundraiser_planner",
  "entity": "fundraiser planner item",
  "categories": [
    {
      "id": "nonprofit",
      "label": "nonprofit",
      "baseline": 2
    },
    {
      "id": "planner",
      "label": "planner",
      "baseline": 2
    },
    {
      "id": "fundraiser",
      "label": "fundraiser",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 30,
    "direction": "higher"
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
        "nonprofit"
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
      "id": "nonprofit_fundraiser_planner-nonprofit-1",
      "name": "nonprofit primary",
      "category": "nonprofit",
      "tags": [
        "nonprofits-community",
        "fundraiser",
        "planner"
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
      "id": "nonprofit_fundraiser_planner-planner-2",
      "name": "planner primary",
      "category": "planner",
      "tags": [
        "nonprofits-community",
        "fundraiser",
        "planner"
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
      "id": "nonprofit_fundraiser_planner-fundraiser-3",
      "name": "fundraiser primary",
      "category": "fundraiser",
      "tags": [
        "nonprofits-community",
        "fundraiser",
        "planner"
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
      "id": "nonprofit_fundraiser_planner-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "nonprofits-community",
        "fundraiser",
        "planner"
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
      "id": "nonprofit_fundraiser_planner-nonprofit-5",
      "name": "nonprofit backup",
      "category": "nonprofit",
      "tags": [
        "nonprofits-community",
        "fundraiser",
        "planner"
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
      "id": "nonprofit_fundraiser_planner-planner-6",
      "name": "planner backup",
      "category": "planner",
      "tags": [
        "nonprofits-community",
        "fundraiser",
        "planner"
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
      "id": "nonprofit_fundraiser_planner-fundraiser-7",
      "name": "fundraiser backup",
      "category": "fundraiser",
      "tags": [
        "nonprofits-community",
        "fundraiser",
        "planner"
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
      "id": "nonprofit_fundraiser_planner-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "nonprofits-community",
        "fundraiser",
        "planner"
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
