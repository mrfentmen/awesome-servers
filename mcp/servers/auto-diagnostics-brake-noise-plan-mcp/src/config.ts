import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "auto-diagnostics-brake-noise-plan-mcp",
  "title": "Brake Noise Planning Audit",
  "description": "Plan brake noise by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "brake_noise_plan",
  "entity": "brake check plan",
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
    "id": "noise_db",
    "label": "Noise level",
    "unit": "dB",
    "target": 60,
    "direction": "lower"
  },
  "target": {
    "maxItems": 16,
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
      "id": "brake_noise_plan-front-pad",
      "name": "Front pad set",
      "category": "front-pad",
      "tags": [
        "ceramic",
        "daily"
      ],
      "cost": 0,
      "quantity": 52,
      "condition": "good"
    },
    {
      "id": "brake_noise_plan-rear-pad",
      "name": "Rear pad set",
      "category": "rear-pad",
      "tags": [
        "ceramic",
        "daily"
      ],
      "cost": 0,
      "quantity": 58,
      "condition": "good"
    },
    {
      "id": "brake_noise_plan-front-rotor",
      "name": "Front rotor pair",
      "category": "rotor",
      "tags": [
        "vented",
        "daily"
      ],
      "cost": 220,
      "quantity": 64,
      "condition": "fair"
    },
    {
      "id": "brake_noise_plan-rear-rotor",
      "name": "Rear rotor pair",
      "category": "rotor",
      "tags": [
        "solid",
        "daily"
      ],
      "cost": 240,
      "quantity": 71,
      "condition": "worn"
    },
    {
      "id": "brake_noise_plan-caliper",
      "name": "Caliper slide pin",
      "category": "caliper",
      "tags": [
        "lubricated",
        "daily"
      ],
      "cost": 180,
      "quantity": 55,
      "condition": "good"
    },
    {
      "id": "brake_noise_plan-fluid",
      "name": "Brake fluid",
      "category": "fluid",
      "tags": [
        "dot-4",
        "fresh"
      ],
      "cost": 20,
      "quantity": 48,
      "condition": "good"
    },
    {
      "id": "brake_noise_plan-dust",
      "name": "Dust shield",
      "category": "caliper",
      "tags": [
        "steel",
        "daily"
      ],
      "cost": 80,
      "quantity": 62,
      "condition": "good"
    },
    {
      "id": "brake_noise_plan-road",
      "name": "Road test",
      "category": "rotor",
      "tags": [
        "test",
        "cold"
      ],
      "cost": 0,
      "quantity": 66,
      "condition": "good"
    }
  ]
}
