import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "horse-stable-checklist-mcp",
  "title": "horse stable checklist Checklist",
  "description": "Real local JSON analysis of horse stable checklist in the Pets & Animals lane. 25 MCP tools, no paywall.",
  "prefix": "pets_horse_stable_checklist",
  "entity": "horse stable checklist item",
  "categories": [
    {
      "id": "pets",
      "label": "pets",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
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
      "id": "pets_horse_stable_checklist-pets-1",
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
      "id": "pets_horse_stable_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
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
      "id": "pets_horse_stable_checklist-horse-stable-3",
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
      "id": "pets_horse_stable_checklist-mcp-4",
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
      "id": "pets_horse_stable_checklist-pets-5",
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
      "id": "pets_horse_stable_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
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
      "id": "pets_horse_stable_checklist-horse-stable-7",
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
      "id": "pets_horse_stable_checklist-mcp-8",
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
