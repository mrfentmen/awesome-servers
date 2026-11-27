import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "circuit-inventory-compare-mcp",
  "title": "circuit inventory compare Compare",
  "description": "Real local JSON analysis of circuit inventory compare in the Telecom & Network Ops lane. 25 MCP tools, no paywall.",
  "prefix": "net_circuit_inventory_compare",
  "entity": "circuit inventory compare item",
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
      "id": "net_circuit_inventory_compare-net-1",
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
      "id": "net_circuit_inventory_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
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
      "id": "net_circuit_inventory_compare-circuit-inventory-3",
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
      "id": "net_circuit_inventory_compare-mcp-4",
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
      "id": "net_circuit_inventory_compare-net-5",
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
      "id": "net_circuit_inventory_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
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
      "id": "net_circuit_inventory_compare-circuit-inventory-7",
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
      "id": "net_circuit_inventory_compare-mcp-8",
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
