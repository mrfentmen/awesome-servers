import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "dogs-senior-dog-sim-mcp",
  "title": "Senior Dog Care Simulator",
  "description": "Simulate senior dog care by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "senior_dog_sim",
  "entity": "senior dog care item simulation",
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
    "id": "comfort_score",
    "label": "Comfort score",
    "unit": "%",
    "target": 80,
    "direction": "higher"
  },
  "target": {
    "maxItems": 18,
    "budget": 900,
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
      "id": "senior_dog_sim-ramp",
      "name": "Car ramp",
      "category": "mobility",
      "tags": [
        "lightweight",
        "foldable"
      ],
      "cost": 120,
      "quantity": 85,
      "condition": "new"
    },
    {
      "id": "senior_dog_sim-joint",
      "name": "Joint supplement",
      "category": "joint",
      "tags": [
        "glucosamine",
        "daily"
      ],
      "cost": 40,
      "quantity": 75,
      "condition": "fair"
    },
    {
      "id": "senior_dog_sim-nightlight",
      "name": "Night light",
      "category": "vision",
      "tags": [
        "motion",
        "hallway"
      ],
      "cost": 20,
      "quantity": 80,
      "condition": "good"
    },
    {
      "id": "senior_dog_sim-vet",
      "name": "Senior vet panel",
      "category": "vet",
      "tags": [
        "bloodwork",
        "annual"
      ],
      "cost": 250,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "senior_dog_sim-bed",
      "name": "Orthopedic bed",
      "category": "comfort",
      "tags": [
        "memory-foam",
        "washable"
      ],
      "cost": 90,
      "quantity": 88,
      "condition": "good"
    },
    {
      "id": "senior_dog_sim-stairs",
      "name": "Indoor stairs",
      "category": "mobility",
      "tags": [
        "carpet",
        "low-step"
      ],
      "cost": 70,
      "quantity": 70,
      "condition": "fair"
    }
  ]
}
