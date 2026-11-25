import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "grocery-list-checklist-mcp",
  "title": "grocery list checklist Checklist",
  "description": "Real local JSON analysis of grocery list checklist in the Food & Farm lane. 25 MCP tools, no paywall.",
  "prefix": "food_grocery_list_checklist",
  "entity": "grocery list checklist item",
  "categories": [
    {
      "id": "food",
      "label": "food",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "grocery-list",
      "label": "grocery-list",
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
        "food"
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
      "id": "food_grocery_list_checklist-food-1",
      "name": "food primary",
      "category": "food",
      "tags": [
        "food-farm",
        "grocery",
        "list"
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
      "id": "food_grocery_list_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "food-farm",
        "grocery",
        "list"
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
      "id": "food_grocery_list_checklist-grocery-list-3",
      "name": "grocery-list primary",
      "category": "grocery-list",
      "tags": [
        "food-farm",
        "grocery",
        "list"
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
      "id": "food_grocery_list_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "food-farm",
        "grocery",
        "list"
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
      "id": "food_grocery_list_checklist-food-5",
      "name": "food backup",
      "category": "food",
      "tags": [
        "food-farm",
        "grocery",
        "list"
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
      "id": "food_grocery_list_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "food-farm",
        "grocery",
        "list"
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
      "id": "food_grocery_list_checklist-grocery-list-7",
      "name": "grocery-list backup",
      "category": "grocery-list",
      "tags": [
        "food-farm",
        "grocery",
        "list"
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
      "id": "food_grocery_list_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "food-farm",
        "grocery",
        "list"
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
