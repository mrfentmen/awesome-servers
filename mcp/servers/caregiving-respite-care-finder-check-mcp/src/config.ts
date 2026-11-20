import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "caregiving-respite-care-finder-check-mcp",
  "title": "Respite Care Finder Audit",
  "description": "Audit respite care finder by short breaks, overnight care, weekend care, backup plan coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "caregiving_respite_care_finder",
  "entity": "respite care finder item",
  "categories": [
    {
      "id": "short-breaks",
      "label": "Short breaks",
      "baseline": 2
    },
    {
      "id": "overnight-care",
      "label": "Overnight care",
      "baseline": 2
    },
    {
      "id": "weekend-care",
      "label": "Weekend care",
      "baseline": 2
    },
    {
      "id": "backup-plan",
      "label": "Backup plan",
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
        "short-breaks"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "backup-plan"
      ]
    }
  ],
  "sample": [
    {
      "id": "caregiving_respite_care_finder-short-breaks-1",
      "name": "Short breaks primary",
      "category": "short-breaks",
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
      "id": "caregiving_respite_care_finder-overnight-care-2",
      "name": "Overnight care primary",
      "category": "overnight-care",
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
      "id": "caregiving_respite_care_finder-weekend-care-3",
      "name": "Weekend care primary",
      "category": "weekend-care",
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
      "id": "caregiving_respite_care_finder-backup-plan-4",
      "name": "Backup plan primary",
      "category": "backup-plan",
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
      "id": "caregiving_respite_care_finder-short-breaks-5",
      "name": "Short breaks backup",
      "category": "short-breaks",
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
      "id": "caregiving_respite_care_finder-overnight-care-6",
      "name": "Overnight care backup",
      "category": "overnight-care",
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
      "id": "caregiving_respite_care_finder-weekend-care-7",
      "name": "Weekend care backup",
      "category": "weekend-care",
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
      "id": "caregiving_respite_care_finder-backup-plan-8",
      "name": "Backup plan backup",
      "category": "backup-plan",
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
