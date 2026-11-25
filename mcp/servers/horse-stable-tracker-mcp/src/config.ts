import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "horse-stable-tracker-mcp",
  "title": "horse stable tracker Tracker",
  "description": "Real local JSON analysis of horse stable tracker in the Pets & Animals lane. 25 MCP tools, no paywall.",
  "prefix": "pets_horse_stable_tracker",
  "entity": "horse stable tracker item",
  "categories": [
    {
      "id": "pets",
      "label": "pets",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "horse-stable",
      "label": "horse-stable",
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
    "label": "Days since activity",
    "unit": "days",
    "target": 7,
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
        "pets"
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
      "id": "pets_horse_stable_tracker-pets-1",
      "name": "pets primary",
      "category": "pets",
      "tags": [
        "pets-animals",
        "horse",
        "stable"
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
      "id": "pets_horse_stable_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "pets-animals",
        "horse",
        "stable"
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
      "id": "pets_horse_stable_tracker-horse-stable-3",
      "name": "horse-stable primary",
      "category": "horse-stable",
      "tags": [
        "pets-animals",
        "horse",
        "stable"
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
      "id": "pets_horse_stable_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "pets-animals",
        "horse",
        "stable"
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
      "id": "pets_horse_stable_tracker-pets-5",
      "name": "pets backup",
      "category": "pets",
      "tags": [
        "pets-animals",
        "horse",
        "stable"
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
      "id": "pets_horse_stable_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "pets-animals",
        "horse",
        "stable"
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
      "id": "pets_horse_stable_tracker-horse-stable-7",
      "name": "horse-stable backup",
      "category": "horse-stable",
      "tags": [
        "pets-animals",
        "horse",
        "stable"
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
      "id": "pets_horse_stable_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "pets-animals",
        "horse",
        "stable"
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
