import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "gardening-soil-health-check-mcp",
  "title": "Soil Health Audit",
  "description": "Audit beds, compost, mulch and cover crops for soil health and organic coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "soil_health",
  "entity": "soil input",
  "categories": [
    {
      "id": "bed",
      "label": "Beds",
      "baseline": 3
    },
    {
      "id": "compost",
      "label": "Compost",
      "baseline": 2
    },
    {
      "id": "mulch",
      "label": "Mulch",
      "baseline": 3
    },
    {
      "id": "cover",
      "label": "Cover crops",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "germination_rate",
    "label": "Soil health",
    "unit": "%",
    "target": 60,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 365
  },
  "dependencies": [
    {
      "id": "bed",
      "label": "Planting bed",
      "categories": [
        "bed"
      ]
    },
    {
      "id": "compost",
      "label": "Compost",
      "categories": [
        "compost"
      ]
    },
    {
      "id": "mulch",
      "label": "Mulch",
      "categories": [
        "mulch"
      ]
    },
    {
      "id": "cover",
      "label": "Cover crop",
      "categories": [
        "cover"
      ]
    }
  ],
  "sample": [
    {
      "id": "soil-bed",
      "name": "Vegetable bed",
      "category": "bed",
      "tags": [
        "raised"
      ],
      "cost": 0,
      "quantity": 70,
      "expires": "2027-06-01",
      "condition": "good"
    },
    {
      "id": "soil-compost",
      "name": "Compost bin",
      "category": "compost",
      "tags": [
        "home"
      ],
      "cost": 20,
      "quantity": 55,
      "expires": "2027-03-01",
      "condition": "good"
    },
    {
      "id": "soil-mulch",
      "name": "Straw mulch",
      "category": "mulch",
      "tags": [
        "straw"
      ],
      "cost": 15,
      "quantity": 80,
      "expires": "2027-09-01",
      "condition": "new"
    },
    {
      "id": "soil-cover",
      "name": "Clover cover crop",
      "category": "cover",
      "tags": [
        "nitrogen"
      ],
      "cost": 8,
      "quantity": 45,
      "expires": "2027-04-01",
      "condition": "fair"
    }
  ]
}
