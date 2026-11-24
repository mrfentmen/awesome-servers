import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "storm-tree-limb-plan-mcp",
  "title": "Storm Tree Limb Plan Compare",
  "description": "Real local JSON analysis of storm tree limb plan in the Good Neighbor lane. 25 MCP tools, no paywall.",
  "prefix": "good_neighbor_storm_tree_limb_plan",
  "entity": "storm tree limb plan item",
  "categories": [
    {
      "id": "rows",
      "label": "Rows",
      "baseline": 2
    },
    {
      "id": "flags",
      "label": "Flags",
      "baseline": 2
    },
    {
      "id": "totals",
      "label": "Totals",
      "baseline": 2
    },
    {
      "id": "notes",
      "label": "Notes",
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
        "rows"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "notes"
      ]
    }
  ],
  "sample": [
    {
      "id": "good_neighbor_storm_tree_limb_plan-rows-1",
      "name": "Rows primary",
      "category": "rows",
      "tags": [
        "good-neighbor",
        "storm",
        "tree"
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
      "id": "good_neighbor_storm_tree_limb_plan-flags-2",
      "name": "Flags primary",
      "category": "flags",
      "tags": [
        "good-neighbor",
        "storm",
        "tree"
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
      "id": "good_neighbor_storm_tree_limb_plan-totals-3",
      "name": "Totals primary",
      "category": "totals",
      "tags": [
        "good-neighbor",
        "storm",
        "tree"
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
      "id": "good_neighbor_storm_tree_limb_plan-notes-4",
      "name": "Notes primary",
      "category": "notes",
      "tags": [
        "good-neighbor",
        "storm",
        "tree"
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
      "id": "good_neighbor_storm_tree_limb_plan-rows-5",
      "name": "Rows backup",
      "category": "rows",
      "tags": [
        "good-neighbor",
        "storm",
        "tree"
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
      "id": "good_neighbor_storm_tree_limb_plan-flags-6",
      "name": "Flags backup",
      "category": "flags",
      "tags": [
        "good-neighbor",
        "storm",
        "tree"
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
      "id": "good_neighbor_storm_tree_limb_plan-totals-7",
      "name": "Totals backup",
      "category": "totals",
      "tags": [
        "good-neighbor",
        "storm",
        "tree"
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
      "id": "good_neighbor_storm_tree_limb_plan-notes-8",
      "name": "Notes backup",
      "category": "notes",
      "tags": [
        "good-neighbor",
        "storm",
        "tree"
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
