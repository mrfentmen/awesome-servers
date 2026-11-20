import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "caregiving-home-safety-audit-check-mcp",
  "title": "Home Safety Audit Audit",
  "description": "Audit home safety audit by bathroom, stairs, kitchen, emergency access coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "caregiving_home_safety_audit",
  "entity": "home safety audit item",
  "categories": [
    {
      "id": "bathroom",
      "label": "Bathroom",
      "baseline": 2
    },
    {
      "id": "stairs",
      "label": "Stairs",
      "baseline": 2
    },
    {
      "id": "kitchen",
      "label": "Kitchen",
      "baseline": 2
    },
    {
      "id": "emergency-access",
      "label": "Emergency access",
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
        "bathroom"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "emergency-access"
      ]
    }
  ],
  "sample": [
    {
      "id": "caregiving_home_safety_audit-bathroom-1",
      "name": "Bathroom primary",
      "category": "bathroom",
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
      "id": "caregiving_home_safety_audit-stairs-2",
      "name": "Stairs primary",
      "category": "stairs",
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
      "id": "caregiving_home_safety_audit-kitchen-3",
      "name": "Kitchen primary",
      "category": "kitchen",
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
      "id": "caregiving_home_safety_audit-emergency-access-4",
      "name": "Emergency access primary",
      "category": "emergency-access",
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
      "id": "caregiving_home_safety_audit-bathroom-5",
      "name": "Bathroom backup",
      "category": "bathroom",
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
      "id": "caregiving_home_safety_audit-stairs-6",
      "name": "Stairs backup",
      "category": "stairs",
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
      "id": "caregiving_home_safety_audit-kitchen-7",
      "name": "Kitchen backup",
      "category": "kitchen",
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
      "id": "caregiving_home_safety_audit-emergency-access-8",
      "name": "Emergency access backup",
      "category": "emergency-access",
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
