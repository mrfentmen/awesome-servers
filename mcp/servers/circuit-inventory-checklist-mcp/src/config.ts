import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "circuit-inventory-checklist-mcp",
  "title": "circuit inventory checklist Checklist",
  "description": "Real local JSON analysis of circuit inventory checklist in the Telecom & Network Ops lane. 25 MCP tools, no paywall.",
  "prefix": "net_circuit_inventory_checklist",
  "entity": "circuit inventory checklist item",
  "categories": [
    {
      "id": "net",
      "label": "net",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "circuit-inventory",
      "label": "circuit-inventory",
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
      "id": "net_circuit_inventory_checklist-net-1",
      "name": "net primary",
      "category": "net",
      "tags": [
        "telecom-network-ops",
        "circuit",
        "inventory"
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
      "id": "net_circuit_inventory_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "telecom-network-ops",
        "circuit",
        "inventory"
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
      "id": "net_circuit_inventory_checklist-circuit-inventory-3",
      "name": "circuit-inventory primary",
      "category": "circuit-inventory",
      "tags": [
        "telecom-network-ops",
        "circuit",
        "inventory"
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
      "id": "net_circuit_inventory_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "telecom-network-ops",
        "circuit",
        "inventory"
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
      "id": "net_circuit_inventory_checklist-net-5",
      "name": "net backup",
      "category": "net",
      "tags": [
        "telecom-network-ops",
        "circuit",
        "inventory"
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
      "id": "net_circuit_inventory_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "telecom-network-ops",
        "circuit",
        "inventory"
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
      "id": "net_circuit_inventory_checklist-circuit-inventory-7",
      "name": "circuit-inventory backup",
      "category": "circuit-inventory",
      "tags": [
        "telecom-network-ops",
        "circuit",
        "inventory"
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
      "id": "net_circuit_inventory_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "telecom-network-ops",
        "circuit",
        "inventory"
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
