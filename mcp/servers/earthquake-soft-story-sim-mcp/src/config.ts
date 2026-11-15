import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earthquake-soft-story-sim-mcp",
  "title": "Soft Story Simulator",
  "description": "Simulate soft story by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "soft_story_sim",
  "entity": "soft-story item simulation",
  "categories": [
    {
      "id": "garage",
      "label": "Garage",
      "baseline": 2
    },
    {
      "id": "bracing",
      "label": "Bracing",
      "baseline": 1
    },
    {
      "id": "foundation",
      "label": "Foundation",
      "baseline": 1
    },
    {
      "id": "inspection",
      "label": "Inspection",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "retrofit_points",
    "label": "Retrofit points",
    "unit": "points",
    "target": 3,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 4350,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "garage",
      "label": "Garage",
      "categories": [
        "garage"
      ]
    },
    {
      "id": "bracing",
      "label": "Bracing",
      "categories": [
        "bracing"
      ]
    },
    {
      "id": "foundation",
      "label": "Foundation",
      "categories": [
        "foundation"
      ]
    },
    {
      "id": "inspection",
      "label": "Inspection",
      "categories": [
        "inspection"
      ]
    }
  ],
  "sample": [
    {
      "id": "soft_story_sim-garage-wall",
      "name": "Garage wall",
      "category": "garage",
      "tags": [
        "garage"
      ],
      "cost": 0,
      "quantity": 3,
      "condition": "fair"
    },
    {
      "id": "soft_story_sim-steel-bracing",
      "name": "Steel bracing",
      "category": "bracing",
      "tags": [
        "bracing"
      ],
      "cost": 1800,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "soft_story_sim-foundation-bolts",
      "name": "Foundation bolts",
      "category": "foundation",
      "tags": [
        "foundation"
      ],
      "cost": 900,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "soft_story_sim-engineer-inspection",
      "name": "Engineer inspection",
      "category": "inspection",
      "tags": [
        "inspection"
      ],
      "cost": 600,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
