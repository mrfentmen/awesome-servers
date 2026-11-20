import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "benefits-social-security-timing-check-mcp",
  "title": "Social Security Timing Audit",
  "description": "Audit social security timing by age, benefit, earnings, spouse coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "benefits_social_security_timing",
  "entity": "social security timing item",
  "categories": [
    {
      "id": "age",
      "label": "Age",
      "baseline": 2
    },
    {
      "id": "benefit",
      "label": "Benefit",
      "baseline": 2
    },
    {
      "id": "earnings",
      "label": "Earnings",
      "baseline": 2
    },
    {
      "id": "spouse",
      "label": "Spouse",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 30,
    "direction": "higher"
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
        "age"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "spouse"
      ]
    }
  ],
  "sample": [
    {
      "id": "benefits_social_security_timing-age-1",
      "name": "Age primary",
      "category": "age",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_social_security_timing-benefit-2",
      "name": "Benefit primary",
      "category": "benefit",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_social_security_timing-earnings-3",
      "name": "Earnings primary",
      "category": "earnings",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_social_security_timing-spouse-4",
      "name": "Spouse primary",
      "category": "spouse",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_social_security_timing-age-5",
      "name": "Age backup",
      "category": "age",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_social_security_timing-benefit-6",
      "name": "Benefit backup",
      "category": "benefit",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_social_security_timing-earnings-7",
      "name": "Earnings backup",
      "category": "earnings",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_social_security_timing-spouse-8",
      "name": "Spouse backup",
      "category": "spouse",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
