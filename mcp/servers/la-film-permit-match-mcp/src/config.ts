import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "la-film-permit-match-mcp",
  "title": "Film Permit Match Audit",
  "description": "Match film permit by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "film_permit_match",
  "entity": "permit item match",
  "categories": [
    {
      "id": "permit",
      "label": "Permit",
      "baseline": 2
    },
    {
      "id": "location",
      "label": "Location",
      "baseline": 1
    },
    {
      "id": "parking",
      "label": "Parking",
      "baseline": 1
    },
    {
      "id": "insurance",
      "label": "Insurance",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "permit_days",
    "label": "Permit days",
    "unit": "days",
    "target": 3,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 3150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "permit",
      "label": "Permit",
      "categories": [
        "permit"
      ]
    },
    {
      "id": "location",
      "label": "Location",
      "categories": [
        "location"
      ]
    },
    {
      "id": "parking",
      "label": "Parking",
      "categories": [
        "parking"
      ]
    },
    {
      "id": "insurance",
      "label": "Insurance",
      "categories": [
        "insurance"
      ]
    }
  ],
  "sample": [
    {
      "id": "film_permit_match-film-permit",
      "name": "Film permit",
      "category": "permit",
      "tags": [
        "permit"
      ],
      "cost": 600,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "film_permit_match-location-fee",
      "name": "Location fee",
      "category": "location",
      "tags": [
        "location"
      ],
      "cost": 1200,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "film_permit_match-parking-plan",
      "name": "Parking plan",
      "category": "parking",
      "tags": [
        "parking"
      ],
      "cost": 300,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "film_permit_match-insurance-certificate",
      "name": "Insurance certificate",
      "category": "insurance",
      "tags": [
        "insurance"
      ],
      "cost": 500,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
