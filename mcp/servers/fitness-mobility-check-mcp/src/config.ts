import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fitness-mobility-check-mcp",
  "title": "Mobility Audit",
  "description": "Audit mobility by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "mobility",
  "entity": "mobility movement",
  "categories": [
    {
      "id": "hips",
      "label": "Hips",
      "baseline": 2
    },
    {
      "id": "shoulders",
      "label": "Shoulders",
      "baseline": 2
    },
    {
      "id": "ankles",
      "label": "Ankles",
      "baseline": 2
    },
    {
      "id": "spine",
      "label": "Spine",
      "baseline": 2
    },
    {
      "id": "wrists",
      "label": "Wrists",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "range_deficit_deg",
    "label": "Range deficit",
    "unit": "deg",
    "target": 10,
    "direction": "lower"
  },
  "target": {
    "maxItems": 16,
    "budget": 80,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "deep-squat",
      "label": "Deep squat",
      "categories": [
        "hips",
        "ankles"
      ]
    },
    {
      "id": "overhead",
      "label": "Overhead reach",
      "categories": [
        "shoulders",
        "spine"
      ]
    },
    {
      "id": "floor",
      "label": "Floor work",
      "categories": [
        "hips",
        "wrists"
      ]
    },
    {
      "id": "rotation",
      "label": "Rotation",
      "categories": [
        "spine",
        "shoulders"
      ]
    }
  ],
  "sample": [
    {
      "id": "mobility-hip-flexor",
      "name": "Hip flexor stretch",
      "category": "hips",
      "tags": [
        "kneeling",
        "daily"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "mobility-90-90",
      "name": "90/90 switch",
      "category": "hips",
      "tags": [
        "floor",
        "rotation"
      ],
      "cost": 0,
      "quantity": 14,
      "condition": "fair"
    },
    {
      "id": "mobility-shoulder-wall",
      "name": "Wall shoulder slide",
      "category": "shoulders",
      "tags": [
        "wall",
        "overhead"
      ],
      "cost": 0,
      "quantity": 9,
      "condition": "good"
    },
    {
      "id": "mobility-thoracic",
      "name": "Thoracic opener",
      "category": "shoulders",
      "tags": [
        "foam-roller",
        "extension"
      ],
      "cost": 0,
      "quantity": 16,
      "condition": "fair"
    },
    {
      "id": "mobility-calf",
      "name": "Calf stretch",
      "category": "ankles",
      "tags": [
        "wall",
        "daily"
      ],
      "cost": 0,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "mobility-ankle-rocks",
      "name": "Ankle rocks",
      "category": "ankles",
      "tags": [
        "knee-to-wall",
        "warmup"
      ],
      "cost": 0,
      "quantity": 11,
      "condition": "good"
    },
    {
      "id": "mobility-cat-cow",
      "name": "Cat-cow",
      "category": "spine",
      "tags": [
        "floor",
        "flexion"
      ],
      "cost": 0,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "mobility-wrist",
      "name": "Wrist circles",
      "category": "wrists",
      "tags": [
        "desk",
        "warmup"
      ],
      "cost": 0,
      "quantity": 13,
      "condition": "good"
    }
  ]
}
