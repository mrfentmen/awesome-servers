import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "blueprint-set-guide-mcp",
  "title": "blueprint set guide Guide",
  "description": "Real local JSON analysis of blueprint set guide in the Build & Factory lane. 25 MCP tools, no paywall.",
  "prefix": "build_blueprint_set_guide",
  "entity": "blueprint set guide item",
  "categories": [
    {
      "id": "build",
      "label": "build",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "blueprint-set",
      "label": "blueprint-set",
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
        "build"
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
      "id": "build_blueprint_set_guide-build-1",
      "name": "build primary",
      "category": "build",
      "tags": [
        "build-factory",
        "blueprint",
        "set"
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
      "id": "build_blueprint_set_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "build-factory",
        "blueprint",
        "set"
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
      "id": "build_blueprint_set_guide-blueprint-set-3",
      "name": "blueprint-set primary",
      "category": "blueprint-set",
      "tags": [
        "build-factory",
        "blueprint",
        "set"
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
      "id": "build_blueprint_set_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "build-factory",
        "blueprint",
        "set"
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
      "id": "build_blueprint_set_guide-build-5",
      "name": "build backup",
      "category": "build",
      "tags": [
        "build-factory",
        "blueprint",
        "set"
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
      "id": "build_blueprint_set_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "build-factory",
        "blueprint",
        "set"
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
      "id": "build_blueprint_set_guide-blueprint-set-7",
      "name": "blueprint-set backup",
      "category": "blueprint-set",
      "tags": [
        "build-factory",
        "blueprint",
        "set"
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
      "id": "build_blueprint_set_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "build-factory",
        "blueprint",
        "set"
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
