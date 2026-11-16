import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "auto-diagnostics-misfire-check-mcp",
  "title": "Misfire Audit",
  "description": "Audit misfire by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "misfire",
  "entity": "misfire counter",
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
    "id": "misfire_count",
    "label": "Misfire count",
    "unit": "events",
    "target": 0,
    "direction": "lower"
  },
  "target": {
    "maxItems": 16,
    "budget": 700,
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
      "id": "misfire-cyl-one",
      "name": "Cylinder 1",
      "category": "cylinder",
      "tags": [
        "counter",
        "cold"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "misfire-cyl-two",
      "name": "Cylinder 2",
      "category": "cylinder",
      "tags": [
        "counter",
        "cold"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "misfire-cyl-three",
      "name": "Cylinder 3",
      "category": "cylinder",
      "tags": [
        "counter",
        "hot"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "fair"
    },
    {
      "id": "misfire-cyl-four",
      "name": "Cylinder 4",
      "category": "cylinder",
      "tags": [
        "counter",
        "hot"
      ],
      "cost": 0,
      "quantity": 15,
      "condition": "worn"
    },
    {
      "id": "misfire-coil",
      "name": "Ignition coil",
      "category": "ignition",
      "tags": [
        "coil",
        "tested"
      ],
      "cost": 60,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "misfire-plug",
      "name": "Spark plug",
      "category": "ignition",
      "tags": [
        "plug",
        "replaced"
      ],
      "cost": 25,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "misfire-injector",
      "name": "Fuel injector",
      "category": "fuel",
      "tags": [
        "injector",
        "tested"
      ],
      "cost": 110,
      "quantity": 6,
      "condition": "fair"
    },
    {
      "id": "misfire-vacuum",
      "name": "Vacuum leak test",
      "category": "compression",
      "tags": [
        "smoke",
        "intake"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
