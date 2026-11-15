import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "weather-pollen-burst-sim-mcp",
  "title": "Pollen Burst Simulator",
  "description": "Simulate pollen burst by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "pollen_burst_sim",
  "entity": "pollen item simulation",
  "categories": [
    {
      "id": "indoor",
      "label": "Indoor",
      "baseline": 2
    },
    {
      "id": "hvac",
      "label": "HVAC",
      "baseline": 1
    },
    {
      "id": "laundry",
      "label": "Laundry",
      "baseline": 1
    },
    {
      "id": "timing",
      "label": "Timing",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "pollen_index",
    "label": "Pollen index",
    "unit": "index",
    "target": 50,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 50,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "indoor",
      "label": "Indoor",
      "categories": [
        "indoor"
      ]
    },
    {
      "id": "hvac",
      "label": "HVAC",
      "categories": [
        "hvac"
      ]
    },
    {
      "id": "laundry",
      "label": "Laundry",
      "categories": [
        "laundry"
      ]
    },
    {
      "id": "timing",
      "label": "Timing",
      "categories": [
        "timing"
      ]
    }
  ],
  "sample": [
    {
      "id": "pollen_burst_sim-indoor-pollen",
      "name": "Indoor pollen",
      "category": "indoor",
      "tags": [
        "indoor"
      ],
      "cost": 0,
      "quantity": 70,
      "condition": "fair"
    },
    {
      "id": "pollen_burst_sim-hvac-filter",
      "name": "HVAC filter",
      "category": "hvac",
      "tags": [
        "hvac"
      ],
      "cost": 40,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "pollen_burst_sim-laundry-routine",
      "name": "Laundry routine",
      "category": "laundry",
      "tags": [
        "laundry"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "pollen_burst_sim-ventilation-window",
      "name": "Ventilation window",
      "category": "timing",
      "tags": [
        "timing"
      ],
      "cost": 0,
      "quantity": 30,
      "condition": "good"
    }
  ]
}
