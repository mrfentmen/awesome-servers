import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earth-rock-id-plan-mcp",
  "title": "Rock Identification Planning Audit",
  "description": "Plan rock identification by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "rock_id_plan",
  "entity": "rock sample plan",
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
    "id": "sample_count",
    "label": "Sample count",
    "unit": "samples",
    "target": 2,
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
      "id": "rock_id_plan-granite-sample",
      "name": "Granite sample",
      "category": "igneous",
      "tags": [
        "igneous"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "rock_id_plan-sandstone-sample",
      "name": "Sandstone sample",
      "category": "sedimentary",
      "tags": [
        "sedimentary"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "rock_id_plan-schist-sample",
      "name": "Schist sample",
      "category": "metamorphic",
      "tags": [
        "metamorphic"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "rock_id_plan-hand-lens",
      "name": "Hand lens",
      "category": "tool",
      "tags": [
        "tool"
      ],
      "cost": 20,
      "quantity": 1,
      "condition": "new"
    }
  ]
}
