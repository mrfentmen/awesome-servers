import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "tower-site-audit-mcp",
  "title": "tower site audit Audit",
  "description": "Real local JSON analysis of tower site audit in the Telecom & Network Ops lane. 25 MCP tools, no paywall.",
  "prefix": "net_tower_site_audit",
  "entity": "tower site audit item",
  "categories": [
    {
      "id": "net",
      "label": "net",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "tower-site",
      "label": "tower-site",
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
        "net"
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
      "id": "net_tower_site_audit-net-1",
      "name": "net primary",
      "category": "net",
      "tags": [
        "telecom-network-ops",
        "tower",
        "site"
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
      "id": "net_tower_site_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "telecom-network-ops",
        "tower",
        "site"
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
      "id": "net_tower_site_audit-tower-site-3",
      "name": "tower-site primary",
      "category": "tower-site",
      "tags": [
        "telecom-network-ops",
        "tower",
        "site"
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
      "id": "net_tower_site_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "telecom-network-ops",
        "tower",
        "site"
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
      "id": "net_tower_site_audit-net-5",
      "name": "net backup",
      "category": "net",
      "tags": [
        "telecom-network-ops",
        "tower",
        "site"
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
      "id": "net_tower_site_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "telecom-network-ops",
        "tower",
        "site"
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
      "id": "net_tower_site_audit-tower-site-7",
      "name": "tower-site backup",
      "category": "tower-site",
      "tags": [
        "telecom-network-ops",
        "tower",
        "site"
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
      "id": "net_tower_site_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "telecom-network-ops",
        "tower",
        "site"
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
