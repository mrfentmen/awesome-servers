import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "backyard-wedding-guest-list-tiers-sim-mcp",
  "title": "Guest List Tiers Simulator",
  "description": "Real local JSON analysis of guest list tiers in the Backyard Weddings lane. 25 MCP tools, no paywall.",
  "prefix": "backyard_wedding_backyard_wedding_guest_list_tiers_sim",
  "entity": "guest list tiers item",
  "categories": [
    {
      "id": "inputs",
      "label": "Inputs",
      "baseline": 2
    },
    {
      "id": "scenarios",
      "label": "Scenarios",
      "baseline": 2
    },
    {
      "id": "outputs",
      "label": "Outputs",
      "baseline": 2
    },
    {
      "id": "assumptions",
      "label": "Assumptions",
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
        "inputs"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "assumptions"
      ]
    }
  ],
  "sample": [
    {
      "id": "backyard_wedding_backyard_wedding_guest_list_tiers_sim-inputs-1",
      "name": "Inputs primary",
      "category": "inputs",
      "tags": [
        "backyard-weddings",
        "backyard",
        "wedding"
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
      "id": "backyard_wedding_backyard_wedding_guest_list_tiers_sim-scenarios-2",
      "name": "Scenarios primary",
      "category": "scenarios",
      "tags": [
        "backyard-weddings",
        "backyard",
        "wedding"
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
      "id": "backyard_wedding_backyard_wedding_guest_list_tiers_sim-outputs-3",
      "name": "Outputs primary",
      "category": "outputs",
      "tags": [
        "backyard-weddings",
        "backyard",
        "wedding"
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
      "id": "backyard_wedding_backyard_wedding_guest_list_tiers_sim-assumptions-4",
      "name": "Assumptions primary",
      "category": "assumptions",
      "tags": [
        "backyard-weddings",
        "backyard",
        "wedding"
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
      "id": "backyard_wedding_backyard_wedding_guest_list_tiers_sim-inputs-5",
      "name": "Inputs backup",
      "category": "inputs",
      "tags": [
        "backyard-weddings",
        "backyard",
        "wedding"
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
      "id": "backyard_wedding_backyard_wedding_guest_list_tiers_sim-scenarios-6",
      "name": "Scenarios backup",
      "category": "scenarios",
      "tags": [
        "backyard-weddings",
        "backyard",
        "wedding"
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
      "id": "backyard_wedding_backyard_wedding_guest_list_tiers_sim-outputs-7",
      "name": "Outputs backup",
      "category": "outputs",
      "tags": [
        "backyard-weddings",
        "backyard",
        "wedding"
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
      "id": "backyard_wedding_backyard_wedding_guest_list_tiers_sim-assumptions-8",
      "name": "Assumptions backup",
      "category": "assumptions",
      "tags": [
        "backyard-weddings",
        "backyard",
        "wedding"
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
