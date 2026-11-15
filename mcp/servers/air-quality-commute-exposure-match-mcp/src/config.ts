import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "air-quality-commute-exposure-match-mcp",
  "title": "Commute Exposure Match Audit",
  "description": "Match commute exposure by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "commute_exposure_match",
  "entity": "commute leg match",
  "categories": [
    {
      "id": "route",
      "label": "Route",
      "baseline": 2
    },
    {
      "id": "mode",
      "label": "Mode",
      "baseline": 1
    },
    {
      "id": "mask",
      "label": "Mask",
      "baseline": 1
    },
    {
      "id": "timing",
      "label": "Timing",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "exposure_minutes",
    "label": "Exposure minutes",
    "unit": "min",
    "target": 30,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "route",
      "label": "Route",
      "categories": [
        "route"
      ]
    },
    {
      "id": "mode",
      "label": "Mode",
      "categories": [
        "mode"
      ]
    },
    {
      "id": "mask",
      "label": "Mask",
      "categories": [
        "mask"
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
      "id": "commute_exposure_match-busy-road-walk",
      "name": "Busy road walk",
      "category": "route",
      "tags": [
        "route"
      ],
      "cost": 0,
      "quantity": 45,
      "condition": "worn"
    },
    {
      "id": "commute_exposure_match-bike-lane-route",
      "name": "Bike lane route",
      "category": "mode",
      "tags": [
        "mode"
      ],
      "cost": 80,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "commute_exposure_match-n95-mask",
      "name": "N95 mask",
      "category": "mask",
      "tags": [
        "mask"
      ],
      "cost": 15,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "commute_exposure_match-early-commute",
      "name": "Early commute",
      "category": "timing",
      "tags": [
        "timing"
      ],
      "cost": 0,
      "quantity": 20,
      "condition": "good"
    }
  ]
}
