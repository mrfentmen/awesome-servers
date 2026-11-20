import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "tenant-neighborhood-fit-check-mcp",
  "title": "Neighborhood Fit Audit",
  "description": "Audit neighborhood fit by commute, noise, safety, services coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "tenant_neighborhood_fit",
  "entity": "neighborhood fit item",
  "categories": [
    {
      "id": "commute",
      "label": "Commute",
      "baseline": 2
    },
    {
      "id": "noise",
      "label": "Noise",
      "baseline": 2
    },
    {
      "id": "safety",
      "label": "Safety",
      "baseline": 2
    },
    {
      "id": "services",
      "label": "Services",
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
        "commute"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "services"
      ]
    }
  ],
  "sample": [
    {
      "id": "tenant_neighborhood_fit-commute-1",
      "name": "Commute primary",
      "category": "commute",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_neighborhood_fit-noise-2",
      "name": "Noise primary",
      "category": "noise",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_neighborhood_fit-safety-3",
      "name": "Safety primary",
      "category": "safety",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_neighborhood_fit-services-4",
      "name": "Services primary",
      "category": "services",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_neighborhood_fit-commute-5",
      "name": "Commute backup",
      "category": "commute",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_neighborhood_fit-noise-6",
      "name": "Noise backup",
      "category": "noise",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_neighborhood_fit-safety-7",
      "name": "Safety backup",
      "category": "safety",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_neighborhood_fit-services-8",
      "name": "Services backup",
      "category": "services",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
