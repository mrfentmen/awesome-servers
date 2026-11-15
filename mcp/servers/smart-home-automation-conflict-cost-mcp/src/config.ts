import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "smart-home-automation-conflict-cost-mcp",
  "title": "Automation Conflict Budget Audit",
  "description": "Audit automation conflict budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "automation_conflict_budget",
  "entity": "automation rule budget line",
  "categories": [
    {
      "id": "lighting",
      "label": "Lighting",
      "baseline": 2
    },
    {
      "id": "climate",
      "label": "Climate",
      "baseline": 1
    },
    {
      "id": "security",
      "label": "Security",
      "baseline": 1
    },
    {
      "id": "scene",
      "label": "Scenes",
      "baseline": 2
    },
    {
      "id": "schedule",
      "label": "Schedules",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 600,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "lighting",
      "label": "Lighting control",
      "categories": [
        "lighting"
      ]
    },
    {
      "id": "climate",
      "label": "Climate control",
      "categories": [
        "climate"
      ]
    },
    {
      "id": "security",
      "label": "Security control",
      "categories": [
        "security"
      ]
    },
    {
      "id": "scenes",
      "label": "Scene control",
      "categories": [
        "scene",
        "schedule"
      ]
    }
  ],
  "sample": [
    {
      "id": "automation_conflict_budget-porch-lights",
      "name": "Porch lights",
      "category": "lighting",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "good"
    },
    {
      "id": "automation_conflict_budget-hallway-lights",
      "name": "Hallway lights",
      "category": "lighting",
      "tags": [
        "budget"
      ],
      "cost": 35,
      "quantity": 35,
      "condition": "good"
    },
    {
      "id": "automation_conflict_budget-thermostat-schedule",
      "name": "Thermostat schedule",
      "category": "climate",
      "tags": [
        "budget"
      ],
      "cost": 180,
      "quantity": 180,
      "condition": "good"
    },
    {
      "id": "automation_conflict_budget-door-lock",
      "name": "Door lock",
      "category": "security",
      "tags": [
        "budget"
      ],
      "cost": 220,
      "quantity": 220,
      "condition": "good"
    },
    {
      "id": "automation_conflict_budget-movie-scene",
      "name": "Movie scene",
      "category": "scene",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "automation_conflict_budget-morning-routine",
      "name": "Morning routine",
      "category": "schedule",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
