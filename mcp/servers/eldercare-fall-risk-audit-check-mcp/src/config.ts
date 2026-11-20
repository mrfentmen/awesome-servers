import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "eldercare-fall-risk-audit-check-mcp",
  "title": "Fall Risk Audit Audit",
  "description": "Audit fall risk audit by bathroom, lighting, stairs, mobility coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "eldercare_fall_risk_audit",
  "entity": "fall risk audit item",
  "categories": [
    {
      "id": "bathroom",
      "label": "Bathroom",
      "baseline": 2
    },
    {
      "id": "lighting",
      "label": "Lighting",
      "baseline": 2
    },
    {
      "id": "stairs",
      "label": "Stairs",
      "baseline": 2
    },
    {
      "id": "mobility",
      "label": "Mobility",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since review",
    "unit": "days",
    "target": 14,
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
        "mobility"
      ]
    }
  ],
  "sample": [
    {
      "id": "eldercare_fall_risk_audit-bathroom-1",
      "name": "Bathroom primary",
      "category": "bathroom",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
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
      "id": "eldercare_fall_risk_audit-lighting-2",
      "name": "Lighting primary",
      "category": "lighting",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
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
      "id": "eldercare_fall_risk_audit-stairs-3",
      "name": "Stairs primary",
      "category": "stairs",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
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
      "id": "eldercare_fall_risk_audit-mobility-4",
      "name": "Mobility primary",
      "category": "mobility",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
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
      "id": "eldercare_fall_risk_audit-bathroom-5",
      "name": "Bathroom backup",
      "category": "bathroom",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
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
      "id": "eldercare_fall_risk_audit-lighting-6",
      "name": "Lighting backup",
      "category": "lighting",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
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
      "id": "eldercare_fall_risk_audit-stairs-7",
      "name": "Stairs backup",
      "category": "stairs",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
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
      "id": "eldercare_fall_risk_audit-mobility-8",
      "name": "Mobility backup",
      "category": "mobility",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
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
