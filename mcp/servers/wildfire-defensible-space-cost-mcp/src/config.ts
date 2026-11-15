import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wildfire-defensible-space-cost-mcp",
  "title": "Defensible Space Budget Audit",
  "description": "Audit defensible space budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "defensible_space_budget",
  "entity": "defensible space item budget line",
  "categories": [
    {
      "id": "zone-0",
      "label": "Zone 0",
      "baseline": 2
    },
    {
      "id": "zone-1",
      "label": "Zone 1",
      "baseline": 1
    },
    {
      "id": "zone-2",
      "label": "Zone 2",
      "baseline": 1
    },
    {
      "id": "access",
      "label": "Access",
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
    "budget": 1300,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "zone-0",
      "label": "Zone 0",
      "categories": [
        "zone-0"
      ]
    },
    {
      "id": "zone-1",
      "label": "Zone 1",
      "categories": [
        "zone-1"
      ]
    },
    {
      "id": "zone-2",
      "label": "Zone 2",
      "categories": [
        "zone-2"
      ]
    },
    {
      "id": "access",
      "label": "Access",
      "categories": [
        "access"
      ]
    }
  ],
  "sample": [
    {
      "id": "defensible_space_budget-zone-0-cleanup",
      "name": "Zone 0 cleanup",
      "category": "zone-0",
      "tags": [
        "budget"
      ],
      "cost": 200,
      "quantity": 200,
      "condition": "new"
    },
    {
      "id": "defensible_space_budget-grass-cutting",
      "name": "Grass cutting",
      "category": "zone-1",
      "tags": [
        "budget"
      ],
      "cost": 100,
      "quantity": 100,
      "condition": "new"
    },
    {
      "id": "defensible_space_budget-tree-thinning",
      "name": "Tree thinning",
      "category": "zone-2",
      "tags": [
        "budget"
      ],
      "cost": 600,
      "quantity": 600,
      "condition": "new"
    },
    {
      "id": "defensible_space_budget-driveway-clearance",
      "name": "Driveway clearance",
      "category": "access",
      "tags": [
        "budget"
      ],
      "cost": 150,
      "quantity": 150,
      "condition": "new"
    }
  ]
}
