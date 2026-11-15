import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "skincare-sun-exposure-sim-mcp",
  "title": "Sun Exposure Simulator",
  "description": "Simulate sun exposure by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "sun_exposure_sim",
  "entity": "sun-care item simulation",
  "categories": [
    {
      "id": "spf",
      "label": "Sunscreen",
      "baseline": 2
    },
    {
      "id": "hat",
      "label": "Hats",
      "baseline": 1
    },
    {
      "id": "sunglasses",
      "label": "Sunglasses",
      "baseline": 1
    },
    {
      "id": "shade",
      "label": "Shade",
      "baseline": 1
    },
    {
      "id": "aftercare",
      "label": "Aftercare",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "spf_coverage",
    "label": "SPF coverage",
    "unit": "%",
    "target": 85,
    "direction": "higher"
  },
  "target": {
    "maxItems": 12,
    "budget": 180,
    "coverage": 0.8,
    "expiryDays": 365
  },
  "dependencies": [
    {
      "id": "sunscreen",
      "label": "Sunscreen",
      "categories": [
        "spf"
      ]
    },
    {
      "id": "cover",
      "label": "Physical cover",
      "categories": [
        "hat",
        "shade"
      ]
    },
    {
      "id": "eyes",
      "label": "Eye protection",
      "categories": [
        "sunglasses"
      ]
    },
    {
      "id": "after",
      "label": "Aftercare",
      "categories": [
        "aftercare"
      ]
    }
  ],
  "sample": [
    {
      "id": "sun_exposure_sim-spf50",
      "name": "SPF 50 lotion",
      "category": "spf",
      "tags": [
        "broad-spectrum",
        "daily"
      ],
      "cost": 32,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "sun_exposure_sim-stick",
      "name": "SPF stick",
      "category": "spf",
      "tags": [
        "travel",
        "mineral"
      ],
      "cost": 18,
      "quantity": 70,
      "condition": "good"
    },
    {
      "id": "sun_exposure_sim-hat",
      "name": "Wide-brim hat",
      "category": "hat",
      "tags": [
        "straw",
        "summer"
      ],
      "cost": 25,
      "quantity": 80,
      "condition": "good"
    },
    {
      "id": "sun_exposure_sim-sunglasses",
      "name": "UV sunglasses",
      "category": "sunglasses",
      "tags": [
        "polarized",
        "daily"
      ],
      "cost": 60,
      "quantity": 85,
      "condition": "good"
    },
    {
      "id": "sun_exposure_sim-sail",
      "name": "Shade sail",
      "category": "shade",
      "tags": [
        "patio",
        "summer"
      ],
      "cost": 90,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "sun_exposure_sim-aloe",
      "name": "After-sun gel",
      "category": "aftercare",
      "tags": [
        "aloe",
        "cooling"
      ],
      "cost": 12,
      "quantity": 50,
      "condition": "good"
    }
  ]
}
