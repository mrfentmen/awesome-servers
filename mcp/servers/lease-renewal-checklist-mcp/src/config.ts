import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "lease-renewal-checklist-mcp",
  "title": "lease renewal checklist Checklist",
  "description": "Real local JSON analysis of lease renewal checklist in the Property & Insurance Ops lane. 25 MCP tools, no paywall.",
  "prefix": "prop_lease_renewal_checklist",
  "entity": "lease renewal checklist item",
  "categories": [
    {
      "id": "prop",
      "label": "prop",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "lease-renewal",
      "label": "lease-renewal",
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
        "prop"
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
      "id": "prop_lease_renewal_checklist-prop-1",
      "name": "prop primary",
      "category": "prop",
      "tags": [
        "property-insurance-ops",
        "lease",
        "renewal"
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
      "id": "prop_lease_renewal_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "property-insurance-ops",
        "lease",
        "renewal"
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
      "id": "prop_lease_renewal_checklist-lease-renewal-3",
      "name": "lease-renewal primary",
      "category": "lease-renewal",
      "tags": [
        "property-insurance-ops",
        "lease",
        "renewal"
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
      "id": "prop_lease_renewal_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "property-insurance-ops",
        "lease",
        "renewal"
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
      "id": "prop_lease_renewal_checklist-prop-5",
      "name": "prop backup",
      "category": "prop",
      "tags": [
        "property-insurance-ops",
        "lease",
        "renewal"
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
      "id": "prop_lease_renewal_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "property-insurance-ops",
        "lease",
        "renewal"
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
      "id": "prop_lease_renewal_checklist-lease-renewal-7",
      "name": "lease-renewal backup",
      "category": "lease-renewal",
      "tags": [
        "property-insurance-ops",
        "lease",
        "renewal"
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
      "id": "prop_lease_renewal_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "property-insurance-ops",
        "lease",
        "renewal"
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
