import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nasa-meteor-shower-sim-mcp",
  "title": "Meteor Shower Simulator",
  "description": "Simulate meteor shower by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "meteor_shower_sim",
  "entity": "shower plan simulation",
  "categories": [
    {
      "id": "peak",
      "label": "Peak",
      "baseline": 2
    },
    {
      "id": "radiant",
      "label": "Radiant",
      "baseline": 1
    },
    {
      "id": "site",
      "label": "Site",
      "baseline": 1
    },
    {
      "id": "gear",
      "label": "Gear",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "dark_hours",
    "label": "Dark hours",
    "unit": "h",
    "target": 4,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 100,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "peak",
      "label": "Peak",
      "categories": [
        "peak"
      ]
    },
    {
      "id": "radiant",
      "label": "Radiant",
      "categories": [
        "radiant"
      ]
    },
    {
      "id": "site",
      "label": "Site",
      "categories": [
        "site"
      ]
    },
    {
      "id": "gear",
      "label": "Gear",
      "categories": [
        "gear"
      ]
    }
  ],
  "sample": [
    {
      "id": "meteor_shower_sim-peak-night",
      "name": "Peak night",
      "category": "peak",
      "tags": [
        "peak"
      ],
      "cost": 0,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "meteor_shower_sim-radiant-position",
      "name": "Radiant position",
      "category": "radiant",
      "tags": [
        "radiant"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "meteor_shower_sim-dark-sky-site",
      "name": "Dark-sky site",
      "category": "site",
      "tags": [
        "site"
      ],
      "cost": 0,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "meteor_shower_sim-gear-kit",
      "name": "Gear kit",
      "category": "gear",
      "tags": [
        "gear"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
