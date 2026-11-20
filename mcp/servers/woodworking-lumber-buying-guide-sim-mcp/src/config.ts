import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "woodworking-lumber-buying-guide-sim-mcp",
  "title": "Lumber Buying Guide Simulator",
  "description": "Real local JSON analysis of lumber buying guide in the Woodworking lane. 25 MCP tools, no paywall.",
  "prefix": "woodworking_woodworking_lumber_buying_guide_sim",
  "entity": "lumber buying guide item",
  "categories": [
    {
      "id": "inputs",
      "label": "Inputs",
      "baseline": 2
    },
    {
      "id": "scenarios",
      "label": "Scenarios",
      "baseline": 2
    },
    {
      "id": "outputs",
      "label": "Outputs",
      "baseline": 2
    },
    {
      "id": "assumptions",
      "label": "Assumptions",
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
        "inputs"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "assumptions"
      ]
    }
  ],
  "sample": [
    {
      "id": "woodworking_woodworking_lumber_buying_guide_sim-inputs-1",
      "name": "Inputs primary",
      "category": "inputs",
      "tags": [
        "woodworking",
        "woodworking",
        "lumber"
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
      "id": "woodworking_woodworking_lumber_buying_guide_sim-scenarios-2",
      "name": "Scenarios primary",
      "category": "scenarios",
      "tags": [
        "woodworking",
        "woodworking",
        "lumber"
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
      "id": "woodworking_woodworking_lumber_buying_guide_sim-outputs-3",
      "name": "Outputs primary",
      "category": "outputs",
      "tags": [
        "woodworking",
        "woodworking",
        "lumber"
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
      "id": "woodworking_woodworking_lumber_buying_guide_sim-assumptions-4",
      "name": "Assumptions primary",
      "category": "assumptions",
      "tags": [
        "woodworking",
        "woodworking",
        "lumber"
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
      "id": "woodworking_woodworking_lumber_buying_guide_sim-inputs-5",
      "name": "Inputs backup",
      "category": "inputs",
      "tags": [
        "woodworking",
        "woodworking",
        "lumber"
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
      "id": "woodworking_woodworking_lumber_buying_guide_sim-scenarios-6",
      "name": "Scenarios backup",
      "category": "scenarios",
      "tags": [
        "woodworking",
        "woodworking",
        "lumber"
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
      "id": "woodworking_woodworking_lumber_buying_guide_sim-outputs-7",
      "name": "Outputs backup",
      "category": "outputs",
      "tags": [
        "woodworking",
        "woodworking",
        "lumber"
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
      "id": "woodworking_woodworking_lumber_buying_guide_sim-assumptions-8",
      "name": "Assumptions backup",
      "category": "assumptions",
      "tags": [
        "woodworking",
        "woodworking",
        "lumber"
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
