import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "tenant-screen-guide-mcp",
  "title": "tenant screen guide Guide",
  "description": "Real local JSON analysis of tenant screen guide in the Property & Insurance Ops lane. 25 MCP tools, no paywall.",
  "prefix": "prop_tenant_screen_guide",
  "entity": "tenant screen guide item",
  "categories": [
    {
      "id": "prop",
      "label": "prop",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "tenant-screen",
      "label": "tenant-screen",
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
      "id": "prop_tenant_screen_guide-prop-1",
      "name": "prop primary",
      "category": "prop",
      "tags": [
        "property-insurance-ops",
        "tenant",
        "screen"
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
      "id": "prop_tenant_screen_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "property-insurance-ops",
        "tenant",
        "screen"
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
      "id": "prop_tenant_screen_guide-tenant-screen-3",
      "name": "tenant-screen primary",
      "category": "tenant-screen",
      "tags": [
        "property-insurance-ops",
        "tenant",
        "screen"
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
      "id": "prop_tenant_screen_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "property-insurance-ops",
        "tenant",
        "screen"
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
      "id": "prop_tenant_screen_guide-prop-5",
      "name": "prop backup",
      "category": "prop",
      "tags": [
        "property-insurance-ops",
        "tenant",
        "screen"
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
      "id": "prop_tenant_screen_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "property-insurance-ops",
        "tenant",
        "screen"
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
      "id": "prop_tenant_screen_guide-tenant-screen-7",
      "name": "tenant-screen backup",
      "category": "tenant-screen",
      "tags": [
        "property-insurance-ops",
        "tenant",
        "screen"
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
      "id": "prop_tenant_screen_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "property-insurance-ops",
        "tenant",
        "screen"
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
