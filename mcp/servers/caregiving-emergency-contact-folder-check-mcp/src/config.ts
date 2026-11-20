import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "caregiving-emergency-contact-folder-check-mcp",
  "title": "Emergency Contact Folder Audit",
  "description": "Audit emergency contact folder by family, doctors, pharmacy, neighbors coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "caregiving_emergency_contact_folder",
  "entity": "emergency contact folder item",
  "categories": [
    {
      "id": "family",
      "label": "Family",
      "baseline": 2
    },
    {
      "id": "doctors",
      "label": "Doctors",
      "baseline": 2
    },
    {
      "id": "pharmacy",
      "label": "Pharmacy",
      "baseline": 2
    },
    {
      "id": "neighbors",
      "label": "Neighbors",
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
        "family"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "neighbors"
      ]
    }
  ],
  "sample": [
    {
      "id": "caregiving_emergency_contact_folder-family-1",
      "name": "Family primary",
      "category": "family",
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
      "id": "caregiving_emergency_contact_folder-doctors-2",
      "name": "Doctors primary",
      "category": "doctors",
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
      "id": "caregiving_emergency_contact_folder-pharmacy-3",
      "name": "Pharmacy primary",
      "category": "pharmacy",
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
      "id": "caregiving_emergency_contact_folder-neighbors-4",
      "name": "Neighbors primary",
      "category": "neighbors",
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
      "id": "caregiving_emergency_contact_folder-family-5",
      "name": "Family backup",
      "category": "family",
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
      "id": "caregiving_emergency_contact_folder-doctors-6",
      "name": "Doctors backup",
      "category": "doctors",
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
      "id": "caregiving_emergency_contact_folder-pharmacy-7",
      "name": "Pharmacy backup",
      "category": "pharmacy",
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
      "id": "caregiving_emergency_contact_folder-neighbors-8",
      "name": "Neighbors backup",
      "category": "neighbors",
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
