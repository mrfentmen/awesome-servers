import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "raw-diet-portion-mcp",
  "title": "Raw Diet Portion Tracker",
  "description": "Real local JSON analysis of raw diet portion in the Puppy Care lane. 25 MCP tools, no paywall.",
  "prefix": "puppy_care_raw_diet_portion",
  "entity": "raw diet portion item",
  "categories": [
    {
      "id": "models",
      "label": "Models",
      "baseline": 2
    },
    {
      "id": "prices",
      "label": "Prices",
      "baseline": 2
    },
    {
      "id": "stock",
      "label": "Stock",
      "baseline": 2
    },
    {
      "id": "shifts",
      "label": "Shifts",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since activity",
    "unit": "days",
    "target": 7,
    "direction": "lower"
  },
  "target": {
    "maxItems": 30,
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "models"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "shifts"
      ]
    }
  ],
  "sample": [
    {
      "id": "puppy_care_raw_diet_portion-models-1",
      "name": "Models primary",
      "category": "models",
      "tags": [
        "puppy-care",
        "raw",
        "diet"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "puppy_care_raw_diet_portion-prices-2",
      "name": "Prices primary",
      "category": "prices",
      "tags": [
        "puppy-care",
        "raw",
        "diet"
      ],
      "cost": 35,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "puppy_care_raw_diet_portion-stock-3",
      "name": "Stock primary",
      "category": "stock",
      "tags": [
        "puppy-care",
        "raw",
        "diet"
      ],
      "cost": 50,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-12",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "puppy_care_raw_diet_portion-shifts-4",
      "name": "Shifts primary",
      "category": "shifts",
      "tags": [
        "puppy-care",
        "raw",
        "diet"
      ],
      "cost": 65,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-26",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "puppy_care_raw_diet_portion-models-5",
      "name": "Models backup",
      "category": "models",
      "tags": [
        "puppy-care",
        "raw",
        "diet"
      ],
      "cost": 80,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-09",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "puppy_care_raw_diet_portion-prices-6",
      "name": "Prices backup",
      "category": "prices",
      "tags": [
        "puppy-care",
        "raw",
        "diet"
      ],
      "cost": 95,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-23",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "puppy_care_raw_diet_portion-stock-7",
      "name": "Stock backup",
      "category": "stock",
      "tags": [
        "puppy-care",
        "raw",
        "diet"
      ],
      "cost": 110,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-09",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "puppy_care_raw_diet_portion-shifts-8",
      "name": "Shifts backup",
      "category": "shifts",
      "tags": [
        "puppy-care",
        "raw",
        "diet"
      ],
      "cost": 125,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-23",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
