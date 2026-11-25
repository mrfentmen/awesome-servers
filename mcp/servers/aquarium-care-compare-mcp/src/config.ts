import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "aquarium-care-compare-mcp",
  "title": "aquarium care compare Compare",
  "description": "Real local JSON analysis of aquarium care compare in the Pets & Animals lane. 25 MCP tools, no paywall.",
  "prefix": "pets_aquarium_care_compare",
  "entity": "aquarium care compare item",
  "categories": [
    {
      "id": "pets",
      "label": "pets",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "aquarium-care",
      "label": "aquarium-care",
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
      "id": "pets_aquarium_care_compare-pets-1",
      "name": "pets primary",
      "category": "pets",
      "tags": [
        "pets-animals",
        "aquarium",
        "care"
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
      "id": "pets_aquarium_care_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "pets-animals",
        "aquarium",
        "care"
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
      "id": "pets_aquarium_care_compare-aquarium-care-3",
      "name": "aquarium-care primary",
      "category": "aquarium-care",
      "tags": [
        "pets-animals",
        "aquarium",
        "care"
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
      "id": "pets_aquarium_care_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "pets-animals",
        "aquarium",
        "care"
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
      "id": "pets_aquarium_care_compare-pets-5",
      "name": "pets backup",
      "category": "pets",
      "tags": [
        "pets-animals",
        "aquarium",
        "care"
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
      "id": "pets_aquarium_care_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "pets-animals",
        "aquarium",
        "care"
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
      "id": "pets_aquarium_care_compare-aquarium-care-7",
      "name": "aquarium-care backup",
      "category": "aquarium-care",
      "tags": [
        "pets-animals",
        "aquarium",
        "care"
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
      "id": "pets_aquarium_care_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "pets-animals",
        "aquarium",
        "care"
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
