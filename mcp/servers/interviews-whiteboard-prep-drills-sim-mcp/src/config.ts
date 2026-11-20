import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "interviews-whiteboard-prep-drills-sim-mcp",
  "title": "Whiteboard Prep Drills Simulator",
  "description": "Real local JSON analysis of whiteboard prep drills in the Interviews lane. 25 MCP tools, no paywall.",
  "prefix": "interviews_interviews_whiteboard_prep_drills_sim",
  "entity": "whiteboard prep drills item",
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
      "id": "interviews_interviews_whiteboard_prep_drills_sim-inputs-1",
      "name": "Inputs primary",
      "category": "inputs",
      "tags": [
        "interviews",
        "interviews",
        "whiteboard"
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
      "id": "interviews_interviews_whiteboard_prep_drills_sim-scenarios-2",
      "name": "Scenarios primary",
      "category": "scenarios",
      "tags": [
        "interviews",
        "interviews",
        "whiteboard"
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
      "id": "interviews_interviews_whiteboard_prep_drills_sim-outputs-3",
      "name": "Outputs primary",
      "category": "outputs",
      "tags": [
        "interviews",
        "interviews",
        "whiteboard"
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
      "id": "interviews_interviews_whiteboard_prep_drills_sim-assumptions-4",
      "name": "Assumptions primary",
      "category": "assumptions",
      "tags": [
        "interviews",
        "interviews",
        "whiteboard"
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
      "id": "interviews_interviews_whiteboard_prep_drills_sim-inputs-5",
      "name": "Inputs backup",
      "category": "inputs",
      "tags": [
        "interviews",
        "interviews",
        "whiteboard"
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
      "id": "interviews_interviews_whiteboard_prep_drills_sim-scenarios-6",
      "name": "Scenarios backup",
      "category": "scenarios",
      "tags": [
        "interviews",
        "interviews",
        "whiteboard"
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
      "id": "interviews_interviews_whiteboard_prep_drills_sim-outputs-7",
      "name": "Outputs backup",
      "category": "outputs",
      "tags": [
        "interviews",
        "interviews",
        "whiteboard"
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
      "id": "interviews_interviews_whiteboard_prep_drills_sim-assumptions-8",
      "name": "Assumptions backup",
      "category": "assumptions",
      "tags": [
        "interviews",
        "interviews",
        "whiteboard"
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
