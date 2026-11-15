import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "dogs-senior-dog-cost-mcp",
  "title": "Senior Dog Care Budget Audit",
  "description": "Audit senior dog care budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "senior_dog_budget",
  "entity": "senior dog care item budget line",
  "categories": [
    {
      "id": "mobility",
      "label": "Mobility",
      "baseline": 1
    },
    {
      "id": "joint",
      "label": "Joints",
      "baseline": 1
    },
    {
      "id": "vision",
      "label": "Vision",
      "baseline": 1
    },
    {
      "id": "vet",
      "label": "Veterinary",
      "baseline": 1
    },
    {
      "id": "comfort",
      "label": "Comfort",
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
    "budget": 750,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "movement",
      "label": "Movement",
      "categories": [
        "mobility"
      ]
    },
    {
      "id": "joints",
      "label": "Joint support",
      "categories": [
        "joint"
      ]
    },
    {
      "id": "senses",
      "label": "Senses",
      "categories": [
        "vision"
      ]
    },
    {
      "id": "health",
      "label": "Health checks",
      "categories": [
        "vet"
      ]
    },
    {
      "id": "rest",
      "label": "Rest",
      "categories": [
        "comfort"
      ]
    }
  ],
  "sample": [
    {
      "id": "senior_dog_budget-car-ramp",
      "name": "Car ramp",
      "category": "mobility",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "new"
    },
    {
      "id": "senior_dog_budget-joint-supplement",
      "name": "Joint supplement",
      "category": "joint",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "fair"
    },
    {
      "id": "senior_dog_budget-night-light",
      "name": "Night light",
      "category": "vision",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "senior_dog_budget-senior-vet-panel",
      "name": "Senior vet panel",
      "category": "vet",
      "tags": [
        "budget"
      ],
      "cost": 250,
      "quantity": 250,
      "condition": "good"
    },
    {
      "id": "senior_dog_budget-orthopedic-bed",
      "name": "Orthopedic bed",
      "category": "comfort",
      "tags": [
        "budget"
      ],
      "cost": 90,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "senior_dog_budget-indoor-stairs",
      "name": "Indoor stairs",
      "category": "mobility",
      "tags": [
        "budget"
      ],
      "cost": 70,
      "quantity": 70,
      "condition": "fair"
    }
  ]
}
