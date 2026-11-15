import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fitness-hydration-plan-mcp",
  "title": "Hydration Planning Audit",
  "description": "Plan hydration by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "hydration_plan",
  "entity": "hydration item plan",
  "categories": [
    {
      "id": "bottle",
      "label": "Bottles",
      "baseline": 2
    },
    {
      "id": "powder",
      "label": "Powders",
      "baseline": 2
    },
    {
      "id": "electrolyte",
      "label": "Electrolytes",
      "baseline": 2
    },
    {
      "id": "mug",
      "label": "Mugs",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Fluid capacity",
    "unit": "fl oz",
    "target": 64,
    "direction": "higher"
  },
  "target": {
    "maxItems": 12,
    "budget": 80,
    "coverage": 0.75,
    "expiryDays": 365
  },
  "dependencies": [
    {
      "id": "bottle",
      "label": "Reusable bottle",
      "categories": [
        "bottle"
      ]
    },
    {
      "id": "mix",
      "label": "Hydration mix",
      "categories": [
        "powder",
        "electrolyte"
      ]
    }
  ],
  "sample": [
    {
      "id": "hydration_plan-bottle",
      "name": "Insulated bottle",
      "category": "bottle",
      "tags": [
        "steel"
      ],
      "cost": 30,
      "quantity": 32,
      "acquired": "2026-01-01",
      "condition": "good"
    },
    {
      "id": "hydration_plan-powder",
      "name": "Electrolyte powder",
      "category": "powder",
      "tags": [
        "citrus"
      ],
      "cost": 20,
      "quantity": 24,
      "acquired": "2026-06-01",
      "expires": "2027-06-01",
      "condition": "new"
    },
    {
      "id": "hydration_plan-tablets",
      "name": "Electrolyte tablets",
      "category": "electrolyte",
      "tags": [
        "portable"
      ],
      "cost": 8,
      "quantity": 16,
      "acquired": "2026-07-01",
      "expires": "2027-07-01",
      "condition": "new"
    },
    {
      "id": "hydration_plan-mug",
      "name": "Travel mug",
      "category": "mug",
      "tags": [
        "insulated"
      ],
      "cost": 18,
      "quantity": 8,
      "acquired": "2025-09-01",
      "condition": "good"
    },
    {
      "id": "hydration_plan-bottle-2",
      "name": "Gym bottle",
      "category": "bottle",
      "tags": [
        "plastic"
      ],
      "cost": 12,
      "quantity": 12,
      "acquired": "2026-02-01",
      "condition": "fair"
    }
  ]
}
