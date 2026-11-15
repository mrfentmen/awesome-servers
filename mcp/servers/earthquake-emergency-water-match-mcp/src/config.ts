import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earthquake-emergency-water-match-mcp",
  "title": "Emergency Water Match Audit",
  "description": "Match emergency water by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "emergency_water_match",
  "entity": "water item match",
  "categories": [
    {
      "id": "storage",
      "label": "Storage",
      "baseline": 2
    },
    {
      "id": "treatment",
      "label": "Treatment",
      "baseline": 1
    },
    {
      "id": "container",
      "label": "Container",
      "baseline": 1
    },
    {
      "id": "plan",
      "label": "Plan",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "water_gallons",
    "label": "Water gallons",
    "unit": "gal",
    "target": 14,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 250,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "storage",
      "label": "Storage",
      "categories": [
        "storage"
      ]
    },
    {
      "id": "treatment",
      "label": "Treatment",
      "categories": [
        "treatment"
      ]
    },
    {
      "id": "container",
      "label": "Container",
      "categories": [
        "container"
      ]
    },
    {
      "id": "plan",
      "label": "Plan",
      "categories": [
        "plan"
      ]
    }
  ],
  "sample": [
    {
      "id": "emergency_water_match-stored-water",
      "name": "Stored water",
      "category": "storage",
      "tags": [
        "storage"
      ],
      "cost": 30,
      "quantity": 14,
      "condition": "new"
    },
    {
      "id": "emergency_water_match-water-filter",
      "name": "Water filter",
      "category": "treatment",
      "tags": [
        "treatment"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "emergency_water_match-jerry-cans",
      "name": "Jerry cans",
      "category": "container",
      "tags": [
        "container"
      ],
      "cost": 60,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "emergency_water_match-water-plan",
      "name": "Water plan",
      "category": "plan",
      "tags": [
        "plan"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
