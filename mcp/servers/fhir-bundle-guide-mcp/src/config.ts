import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fhir-bundle-guide-mcp",
  "title": "fhir bundle guide Guide",
  "description": "Real local JSON analysis of fhir bundle guide in the Health & Care Work lane. 25 MCP tools, no paywall.",
  "prefix": "care_fhir_bundle_guide",
  "entity": "fhir bundle guide item",
  "categories": [
    {
      "id": "care",
      "label": "care",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "fhir-bundle",
      "label": "fhir-bundle",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
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
        "care"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "mcp"
      ]
    }
  ],
  "sample": [
    {
      "id": "care_fhir_bundle_guide-care-1",
      "name": "care primary",
      "category": "care",
      "tags": [
        "health-care-work",
        "fhir",
        "bundle"
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
      "id": "care_fhir_bundle_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "health-care-work",
        "fhir",
        "bundle"
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
      "id": "care_fhir_bundle_guide-fhir-bundle-3",
      "name": "fhir-bundle primary",
      "category": "fhir-bundle",
      "tags": [
        "health-care-work",
        "fhir",
        "bundle"
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
      "id": "care_fhir_bundle_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "health-care-work",
        "fhir",
        "bundle"
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
      "id": "care_fhir_bundle_guide-care-5",
      "name": "care backup",
      "category": "care",
      "tags": [
        "health-care-work",
        "fhir",
        "bundle"
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
      "id": "care_fhir_bundle_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "health-care-work",
        "fhir",
        "bundle"
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
      "id": "care_fhir_bundle_guide-fhir-bundle-7",
      "name": "fhir-bundle backup",
      "category": "fhir-bundle",
      "tags": [
        "health-care-work",
        "fhir",
        "bundle"
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
      "id": "care_fhir_bundle_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "health-care-work",
        "fhir",
        "bundle"
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
