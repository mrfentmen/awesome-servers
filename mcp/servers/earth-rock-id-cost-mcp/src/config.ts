import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earth-rock-id-cost-mcp",
  "title": "Rock Identification Budget Audit",
  "description": "Audit rock identification budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "rock_id_budget",
  "entity": "rock sample budget line",
  "categories": [
    {
      "id": "igneous",
      "label": "Igneous",
      "baseline": 2
    },
    {
      "id": "sedimentary",
      "label": "Sedimentary",
      "baseline": 1
    },
    {
      "id": "metamorphic",
      "label": "Metamorphic",
      "baseline": 1
    },
    {
      "id": "tool",
      "label": "Tool",
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
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "igneous",
      "label": "Igneous",
      "categories": [
        "igneous"
      ]
    },
    {
      "id": "sedimentary",
      "label": "Sedimentary",
      "categories": [
        "sedimentary"
      ]
    },
    {
      "id": "metamorphic",
      "label": "Metamorphic",
      "categories": [
        "metamorphic"
      ]
    },
    {
      "id": "tool",
      "label": "Tool",
      "categories": [
        "tool"
      ]
    }
  ],
  "sample": [
    {
      "id": "rock_id_budget-field-guide",
      "name": "Field guide",
      "category": "igneous",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "rock_id_budget-hardness-test-kit",
      "name": "Hardness test kit",
      "category": "sedimentary",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "rock_id_budget-hand-lens",
      "name": "Hand lens",
      "category": "metamorphic",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "new"
    },
    {
      "id": "rock_id_budget-sample-storage",
      "name": "Sample storage",
      "category": "tool",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "new"
    }
  ]
}
