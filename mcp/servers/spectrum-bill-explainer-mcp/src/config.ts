import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "spectrum-bill-explainer-mcp",
  "title": "Spectrum Bill Explainer Tracker",
  "description": "Real local JSON analysis of spectrum bill explainer in the Spectrum Bill lane. 25 MCP tools, no paywall.",
  "prefix": "spectrum_bill_spectrum_bill_explainer",
  "entity": "spectrum bill explainer item",
  "categories": [
    {
      "id": "coverage",
      "label": "Coverage",
      "baseline": 2
    },
    {
      "id": "gaps",
      "label": "Gaps",
      "baseline": 2
    },
    {
      "id": "costs",
      "label": "Costs",
      "baseline": 2
    },
    {
      "id": "deadlines",
      "label": "Deadlines",
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
        "coverage"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "deadlines"
      ]
    }
  ],
  "sample": [
    {
      "id": "spectrum_bill_spectrum_bill_explainer-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "spectrum-bill",
        "spectrum",
        "bill"
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
      "id": "spectrum_bill_spectrum_bill_explainer-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "spectrum-bill",
        "spectrum",
        "bill"
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
      "id": "spectrum_bill_spectrum_bill_explainer-costs-3",
      "name": "Costs primary",
      "category": "costs",
      "tags": [
        "spectrum-bill",
        "spectrum",
        "bill"
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
      "id": "spectrum_bill_spectrum_bill_explainer-deadlines-4",
      "name": "Deadlines primary",
      "category": "deadlines",
      "tags": [
        "spectrum-bill",
        "spectrum",
        "bill"
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
      "id": "spectrum_bill_spectrum_bill_explainer-coverage-5",
      "name": "Coverage backup",
      "category": "coverage",
      "tags": [
        "spectrum-bill",
        "spectrum",
        "bill"
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
      "id": "spectrum_bill_spectrum_bill_explainer-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "spectrum-bill",
        "spectrum",
        "bill"
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
      "id": "spectrum_bill_spectrum_bill_explainer-costs-7",
      "name": "Costs backup",
      "category": "costs",
      "tags": [
        "spectrum-bill",
        "spectrum",
        "bill"
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
      "id": "spectrum_bill_spectrum_bill_explainer-deadlines-8",
      "name": "Deadlines backup",
      "category": "deadlines",
      "tags": [
        "spectrum-bill",
        "spectrum",
        "bill"
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
