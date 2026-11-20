import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "caregiving-mobility-equipment-fit-check-mcp",
  "title": "Mobility Equipment Fit Audit",
  "description": "Audit mobility equipment fit by walker, wheelchair, bed rails, bath aids coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "caregiving_mobility_equipment_fit",
  "entity": "mobility equipment fit item",
  "categories": [
    {
      "id": "walker",
      "label": "Walker",
      "baseline": 2
    },
    {
      "id": "wheelchair",
      "label": "Wheelchair",
      "baseline": 2
    },
    {
      "id": "bed-rails",
      "label": "Bed rails",
      "baseline": 2
    },
    {
      "id": "bath-aids",
      "label": "Bath aids",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since review",
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
        "walker"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "bath-aids"
      ]
    }
  ],
  "sample": [
    {
      "id": "caregiving_mobility_equipment_fit-walker-1",
      "name": "Walker primary",
      "category": "walker",
      "tags": [
        "caregiving",
        "caregiver",
        "family-care"
      ],
      "cost": 20,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "caregiving_mobility_equipment_fit-wheelchair-2",
      "name": "Wheelchair primary",
      "category": "wheelchair",
      "tags": [
        "caregiving",
        "caregiver",
        "family-care"
      ],
      "cost": 35,
      "quantity": 7,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "caregiving_mobility_equipment_fit-bed-rails-3",
      "name": "Bed rails primary",
      "category": "bed-rails",
      "tags": [
        "caregiving",
        "caregiver",
        "family-care"
      ],
      "cost": 50,
      "quantity": 12,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-12",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "caregiving_mobility_equipment_fit-bath-aids-4",
      "name": "Bath aids primary",
      "category": "bath-aids",
      "tags": [
        "caregiving",
        "caregiver",
        "family-care"
      ],
      "cost": 65,
      "quantity": 17,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-26",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "caregiving_mobility_equipment_fit-walker-5",
      "name": "Walker backup",
      "category": "walker",
      "tags": [
        "caregiving",
        "caregiver",
        "family-care"
      ],
      "cost": 80,
      "quantity": 22,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-09",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "caregiving_mobility_equipment_fit-wheelchair-6",
      "name": "Wheelchair backup",
      "category": "wheelchair",
      "tags": [
        "caregiving",
        "caregiver",
        "family-care"
      ],
      "cost": 95,
      "quantity": 27,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-23",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "caregiving_mobility_equipment_fit-bed-rails-7",
      "name": "Bed rails backup",
      "category": "bed-rails",
      "tags": [
        "caregiving",
        "caregiver",
        "family-care"
      ],
      "cost": 110,
      "quantity": 32,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-09",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "caregiving_mobility_equipment_fit-bath-aids-8",
      "name": "Bath aids backup",
      "category": "bath-aids",
      "tags": [
        "caregiving",
        "caregiver",
        "family-care"
      ],
      "cost": 125,
      "quantity": 37,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-23",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
