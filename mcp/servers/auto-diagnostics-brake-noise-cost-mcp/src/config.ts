import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "auto-diagnostics-brake-noise-cost-mcp",
  "title": "Brake Noise Budget Audit",
  "description": "Audit brake noise budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "brake_noise_budget",
  "entity": "brake check budget line",
  "categories": [
    {
      "id": "front-pad",
      "label": "Front pads",
      "baseline": 2
    },
    {
      "id": "rear-pad",
      "label": "Rear pads",
      "baseline": 2
    },
    {
      "id": "rotor",
      "label": "Rotors",
      "baseline": 2
    },
    {
      "id": "caliper",
      "label": "Calipers",
      "baseline": 1
    },
    {
      "id": "fluid",
      "label": "Fluid",
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
    "budget": 900,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "front",
      "label": "Front brakes",
      "categories": [
        "front-pad",
        "rotor"
      ]
    },
    {
      "id": "rear",
      "label": "Rear brakes",
      "categories": [
        "rear-pad",
        "rotor"
      ]
    },
    {
      "id": "hydraulic",
      "label": "Hydraulic system",
      "categories": [
        "caliper",
        "fluid"
      ]
    }
  ],
  "sample": [
    {
      "id": "brake_noise_budget-front-pad-set",
      "name": "Front pad set",
      "category": "front-pad",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "brake_noise_budget-rear-pad-set",
      "name": "Rear pad set",
      "category": "rear-pad",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "brake_noise_budget-front-rotor-pair",
      "name": "Front rotor pair",
      "category": "rotor",
      "tags": [
        "budget"
      ],
      "cost": 220,
      "quantity": 220,
      "condition": "fair"
    },
    {
      "id": "brake_noise_budget-rear-rotor-pair",
      "name": "Rear rotor pair",
      "category": "rotor",
      "tags": [
        "budget"
      ],
      "cost": 240,
      "quantity": 240,
      "condition": "worn"
    },
    {
      "id": "brake_noise_budget-caliper-slide-pin",
      "name": "Caliper slide pin",
      "category": "caliper",
      "tags": [
        "budget"
      ],
      "cost": 180,
      "quantity": 180,
      "condition": "good"
    },
    {
      "id": "brake_noise_budget-brake-fluid",
      "name": "Brake fluid",
      "category": "fluid",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "brake_noise_budget-dust-shield",
      "name": "Dust shield",
      "category": "caliper",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "good"
    },
    {
      "id": "brake_noise_budget-road-test",
      "name": "Road test",
      "category": "rotor",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
