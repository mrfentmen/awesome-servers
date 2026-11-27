import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "vlan-plan-compare-mcp",
  "title": "vlan plan compare Compare",
  "description": "Real local JSON analysis of vlan plan compare in the Telecom & Network Ops lane. 25 MCP tools, no paywall.",
  "prefix": "net_vlan_plan_compare",
  "entity": "vlan plan compare item",
  "categories": [
    {
      "id": "net",
      "label": "net",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "vlan-plan",
      "label": "vlan-plan",
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
      "id": "net_vlan_plan_compare-net-1",
      "name": "net primary",
      "category": "net",
      "tags": [
        "telecom-network-ops",
        "vlan",
        "plan"
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
      "id": "net_vlan_plan_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "telecom-network-ops",
        "vlan",
        "plan"
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
      "id": "net_vlan_plan_compare-vlan-plan-3",
      "name": "vlan-plan primary",
      "category": "vlan-plan",
      "tags": [
        "telecom-network-ops",
        "vlan",
        "plan"
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
      "id": "net_vlan_plan_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "telecom-network-ops",
        "vlan",
        "plan"
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
      "id": "net_vlan_plan_compare-net-5",
      "name": "net backup",
      "category": "net",
      "tags": [
        "telecom-network-ops",
        "vlan",
        "plan"
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
      "id": "net_vlan_plan_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "telecom-network-ops",
        "vlan",
        "plan"
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
      "id": "net_vlan_plan_compare-vlan-plan-7",
      "name": "vlan-plan backup",
      "category": "vlan-plan",
      "tags": [
        "telecom-network-ops",
        "vlan",
        "plan"
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
      "id": "net_vlan_plan_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "telecom-network-ops",
        "vlan",
        "plan"
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
