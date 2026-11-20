import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "caregiving-caregiver-burnout-check-check-mcp",
  "title": "Caregiver Burnout Check Audit",
  "description": "Audit caregiver burnout check by sleep, support, respite, health coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "caregiving_caregiver_burnout_check",
  "entity": "caregiver burnout check item",
  "categories": [
    {
      "id": "sleep",
      "label": "Sleep",
      "baseline": 2
    },
    {
      "id": "support",
      "label": "Support",
      "baseline": 2
    },
    {
      "id": "respite",
      "label": "Respite",
      "baseline": 2
    },
    {
      "id": "health",
      "label": "Health",
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
        "sleep"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "health"
      ]
    }
  ],
  "sample": [
    {
      "id": "caregiving_caregiver_burnout_check-sleep-1",
      "name": "Sleep primary",
      "category": "sleep",
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
      "id": "caregiving_caregiver_burnout_check-support-2",
      "name": "Support primary",
      "category": "support",
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
      "id": "caregiving_caregiver_burnout_check-respite-3",
      "name": "Respite primary",
      "category": "respite",
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
      "id": "caregiving_caregiver_burnout_check-health-4",
      "name": "Health primary",
      "category": "health",
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
      "id": "caregiving_caregiver_burnout_check-sleep-5",
      "name": "Sleep backup",
      "category": "sleep",
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
      "id": "caregiving_caregiver_burnout_check-support-6",
      "name": "Support backup",
      "category": "support",
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
      "id": "caregiving_caregiver_burnout_check-respite-7",
      "name": "Respite backup",
      "category": "respite",
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
      "id": "caregiving_caregiver_burnout_check-health-8",
      "name": "Health backup",
      "category": "health",
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
