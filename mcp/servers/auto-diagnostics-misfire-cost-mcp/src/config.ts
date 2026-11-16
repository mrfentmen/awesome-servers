import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "auto-diagnostics-misfire-cost-mcp",
  "title": "Misfire Budget Audit",
  "description": "Audit misfire budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "misfire_budget",
  "entity": "misfire counter budget line",
  "categories": [
    {
      "id": "cylinder",
      "label": "Cylinders",
      "baseline": 4
    },
    {
      "id": "ignition",
      "label": "Ignition",
      "baseline": 2
    },
    {
      "id": "fuel",
      "label": "Fuel",
      "baseline": 2
    },
    {
      "id": "compression",
      "label": "Compression",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 250,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "ignition",
      "label": "Ignition path",
      "categories": [
        "ignition"
      ]
    },
    {
      "id": "fuel",
      "label": "Fuel path",
      "categories": [
        "fuel"
      ]
    },
    {
      "id": "compression",
      "label": "Compression",
      "categories": [
        "compression"
      ]
    }
  ],
  "sample": [
    {
      "id": "misfire_budget-cylinder-1",
      "name": "Cylinder 1",
      "category": "cylinder",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "misfire_budget-cylinder-2",
      "name": "Cylinder 2",
      "category": "cylinder",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "misfire_budget-cylinder-3",
      "name": "Cylinder 3",
      "category": "cylinder",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "misfire_budget-cylinder-4",
      "name": "Cylinder 4",
      "category": "cylinder",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "worn"
    },
    {
      "id": "misfire_budget-ignition-coil",
      "name": "Ignition coil",
      "category": "ignition",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "misfire_budget-spark-plug",
      "name": "Spark plug",
      "category": "ignition",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "misfire_budget-fuel-injector",
      "name": "Fuel injector",
      "category": "fuel",
      "tags": [
        "budget"
      ],
      "cost": 110,
      "quantity": 110,
      "condition": "fair"
    },
    {
      "id": "misfire_budget-vacuum-leak-test",
      "name": "Vacuum leak test",
      "category": "compression",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
