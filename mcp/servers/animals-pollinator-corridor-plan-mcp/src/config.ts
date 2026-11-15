import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "animals-pollinator-corridor-plan-mcp",
  "title": "Pollinator Corridor Planning Audit",
  "description": "Plan pollinator corridor by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "pollinator_corridor_plan",
  "entity": "corridor patch plan",
  "categories": [
    {
      "id": "patches",
      "label": "Patches",
      "baseline": 2
    },
    {
      "id": "bloom",
      "label": "Bloom",
      "baseline": 1
    },
    {
      "id": "nesting",
      "label": "Nesting",
      "baseline": 1
    },
    {
      "id": "pesticide",
      "label": "Pesticide",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "bloom_weeks",
    "label": "Bloom weeks",
    "unit": "weeks",
    "target": 12,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "patches",
      "label": "Patches",
      "categories": [
        "patches"
      ]
    },
    {
      "id": "bloom",
      "label": "Bloom",
      "categories": [
        "bloom"
      ]
    },
    {
      "id": "nesting",
      "label": "Nesting",
      "categories": [
        "nesting"
      ]
    },
    {
      "id": "pesticide",
      "label": "Pesticide",
      "categories": [
        "pesticide"
      ]
    }
  ],
  "sample": [
    {
      "id": "pollinator_corridor_plan-front-patch",
      "name": "Front patch",
      "category": "patches",
      "tags": [
        "patches"
      ],
      "cost": 60,
      "quantity": 16,
      "condition": "good"
    },
    {
      "id": "pollinator_corridor_plan-side-strip",
      "name": "Side strip",
      "category": "bloom",
      "tags": [
        "bloom"
      ],
      "cost": 40,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "pollinator_corridor_plan-nesting-block",
      "name": "Nesting block",
      "category": "nesting",
      "tags": [
        "nesting"
      ],
      "cost": 25,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "pollinator_corridor_plan-pesticide-free-buffer",
      "name": "Pesticide-free buffer",
      "category": "pesticide",
      "tags": [
        "pesticide"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
