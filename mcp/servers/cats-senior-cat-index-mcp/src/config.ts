import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cats-senior-cat-index-mcp",
  "title": "Senior Cat Care Archive",
  "description": "Archive senior cat care by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "senior_cat_index",
  "entity": "senior cat care item archive",
  "categories": [
    {
      "id": "mobility",
      "label": "Mobility",
      "baseline": 1
    },
    {
      "id": "kidney",
      "label": "Kidney",
      "baseline": 1
    },
    {
      "id": "dental",
      "label": "Dental",
      "baseline": 1
    },
    {
      "id": "vet",
      "label": "Veterinary",
      "baseline": 1
    },
    {
      "id": "comfort",
      "label": "Comfort",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "comfort_score",
    "label": "Comfort score",
    "unit": "%",
    "target": 80,
    "direction": "higher"
  },
  "target": {
    "maxItems": 18,
    "budget": 700,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "movement",
      "label": "Movement",
      "categories": [
        "mobility"
      ]
    },
    {
      "id": "kidney",
      "label": "Kidney support",
      "categories": [
        "kidney"
      ]
    },
    {
      "id": "dental",
      "label": "Dental support",
      "categories": [
        "dental"
      ]
    },
    {
      "id": "health",
      "label": "Health checks",
      "categories": [
        "vet"
      ]
    },
    {
      "id": "rest",
      "label": "Rest",
      "categories": [
        "comfort"
      ]
    }
  ],
  "sample": [
    {
      "id": "senior_cat_index-steps",
      "name": "Low stairs",
      "category": "mobility",
      "tags": [
        "carpet",
        "wide"
      ],
      "cost": 60,
      "quantity": 82,
      "condition": "new"
    },
    {
      "id": "senior_cat_index-water",
      "name": "Water fountain",
      "category": "kidney",
      "tags": [
        "filtered",
        "quiet"
      ],
      "cost": 50,
      "quantity": 88,
      "condition": "good"
    },
    {
      "id": "senior_cat_index-dental",
      "name": "Dental chews",
      "category": "dental",
      "tags": [
        "soft",
        "daily"
      ],
      "cost": 18,
      "quantity": 70,
      "condition": "fair"
    },
    {
      "id": "senior_cat_index-vet",
      "name": "Senior blood panel",
      "category": "vet",
      "tags": [
        "kidney",
        "annual"
      ],
      "cost": 220,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "senior_cat_index-bed",
      "name": "Heated bed",
      "category": "comfort",
      "tags": [
        "low-entry",
        "washable"
      ],
      "cost": 75,
      "quantity": 86,
      "condition": "good"
    },
    {
      "id": "senior_cat_index-litter",
      "name": "Low-entry litter box",
      "category": "mobility",
      "tags": [
        "low-side",
        "large"
      ],
      "cost": 40,
      "quantity": 84,
      "condition": "good"
    }
  ]
}
