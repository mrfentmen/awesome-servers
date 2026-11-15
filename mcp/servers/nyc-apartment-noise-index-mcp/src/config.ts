import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nyc-apartment-noise-index-mcp",
  "title": "Apartment Noise Archive",
  "description": "Archive apartment noise by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "apartment_noise_index",
  "entity": "noise reading archive",
  "categories": [
    {
      "id": "street",
      "label": "Street",
      "baseline": 2
    },
    {
      "id": "neighbor",
      "label": "Neighbor",
      "baseline": 1
    },
    {
      "id": "hvac",
      "label": "HVAC",
      "baseline": 1
    },
    {
      "id": "night",
      "label": "Night",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "noise_db",
    "label": "Noise",
    "unit": "dB",
    "target": 45,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 650,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "street",
      "label": "Street",
      "categories": [
        "street"
      ]
    },
    {
      "id": "neighbor",
      "label": "Neighbor",
      "categories": [
        "neighbor"
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
      "id": "night",
      "label": "Night",
      "categories": [
        "night"
      ]
    }
  ],
  "sample": [
    {
      "id": "apartment_noise_index-street-facing-wall",
      "name": "Street-facing wall",
      "category": "street",
      "tags": [
        "street"
      ],
      "cost": 0,
      "quantity": 52,
      "condition": "fair"
    },
    {
      "id": "apartment_noise_index-shared-wall",
      "name": "Shared wall",
      "category": "neighbor",
      "tags": [
        "neighbor"
      ],
      "cost": 0,
      "quantity": 40,
      "condition": "good"
    },
    {
      "id": "apartment_noise_index-hvac-vent",
      "name": "HVAC vent",
      "category": "hvac",
      "tags": [
        "hvac"
      ],
      "cost": 0,
      "quantity": 48,
      "condition": "fair"
    },
    {
      "id": "apartment_noise_index-night-bedroom",
      "name": "Night bedroom",
      "category": "night",
      "tags": [
        "night"
      ],
      "cost": 0,
      "quantity": 38,
      "condition": "good"
    }
  ]
}
