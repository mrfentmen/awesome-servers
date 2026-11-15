import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "la-beach-water-plan-mcp",
  "title": "Beach Water Planning Audit",
  "description": "Plan beach water by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "beach_water_plan",
  "entity": "beach sample plan",
  "categories": [
    {
      "id": "bacteria",
      "label": "Bacteria",
      "baseline": 2
    },
    {
      "id": "closure",
      "label": "Closure",
      "baseline": 1
    },
    {
      "id": "access",
      "label": "Access",
      "baseline": 1
    },
    {
      "id": "testing",
      "label": "Testing",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "bacteria_mpn",
    "label": "Bacteria",
    "unit": "MPN/100mL",
    "target": 100,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 100,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "bacteria",
      "label": "Bacteria",
      "categories": [
        "bacteria"
      ]
    },
    {
      "id": "closure",
      "label": "Closure",
      "categories": [
        "closure"
      ]
    },
    {
      "id": "access",
      "label": "Access",
      "categories": [
        "access"
      ]
    },
    {
      "id": "testing",
      "label": "Testing",
      "categories": [
        "testing"
      ]
    }
  ],
  "sample": [
    {
      "id": "beach_water_plan-surf-zone-sample",
      "name": "Surf zone sample",
      "category": "bacteria",
      "tags": [
        "bacteria"
      ],
      "cost": 0,
      "quantity": 45,
      "condition": "good"
    },
    {
      "id": "beach_water_plan-closure-status",
      "name": "Closure status",
      "category": "closure",
      "tags": [
        "closure"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "beach_water_plan-access-path",
      "name": "Access path",
      "category": "access",
      "tags": [
        "access"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "beach_water_plan-lab-test",
      "name": "Lab test",
      "category": "testing",
      "tags": [
        "testing"
      ],
      "cost": 40,
      "quantity": 1,
      "condition": "new"
    }
  ]
}
