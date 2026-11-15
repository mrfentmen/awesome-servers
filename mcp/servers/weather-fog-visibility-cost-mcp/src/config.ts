import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "weather-fog-visibility-cost-mcp",
  "title": "Fog Visibility Budget Audit",
  "description": "Audit fog visibility budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fog_visibility_budget",
  "entity": "visibility item budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 500,
    "direction": "lower"
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
      "id": "fog_visibility_budget-route-survey",
      "name": "Route survey",
      "category": "route",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "fog_visibility_budget-fog-lights",
      "name": "Fog lights",
      "category": "lights",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "new"
    },
    {
      "id": "fog_visibility_budget-reflectors",
      "name": "Reflectors",
      "category": "reflectors",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "new"
    },
    {
      "id": "fog_visibility_budget-visibility-plan",
      "name": "Visibility plan",
      "category": "plan",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
