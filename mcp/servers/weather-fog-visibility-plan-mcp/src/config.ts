import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "weather-fog-visibility-plan-mcp",
  "title": "Fog Visibility Planning Audit",
  "description": "Plan fog visibility by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fog_visibility_plan",
  "entity": "visibility item plan",
  "categories": [
    {
      "id": "route",
      "label": "Route",
      "baseline": 2
    },
    {
      "id": "lights",
      "label": "Lights",
      "baseline": 1
    },
    {
      "id": "reflectors",
      "label": "Reflectors",
      "baseline": 1
    },
    {
      "id": "plan",
      "label": "Plan",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "visibility_ft",
    "label": "Visibility",
    "unit": "ft",
    "target": 300,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "route",
      "label": "Route",
      "categories": [
        "route"
      ]
    },
    {
      "id": "lights",
      "label": "Lights",
      "categories": [
        "lights"
      ]
    },
    {
      "id": "reflectors",
      "label": "Reflectors",
      "categories": [
        "reflectors"
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
      "id": "fog_visibility_plan-route-visibility",
      "name": "Route visibility",
      "category": "route",
      "tags": [
        "route"
      ],
      "cost": 0,
      "quantity": 300,
      "condition": "fair"
    },
    {
      "id": "fog_visibility_plan-fog-lights",
      "name": "Fog lights",
      "category": "lights",
      "tags": [
        "lights"
      ],
      "cost": 120,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "fog_visibility_plan-road-reflectors",
      "name": "Road reflectors",
      "category": "reflectors",
      "tags": [
        "reflectors"
      ],
      "cost": 20,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "fog_visibility_plan-fog-plan",
      "name": "Fog plan",
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
