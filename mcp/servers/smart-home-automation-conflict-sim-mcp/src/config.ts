import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "smart-home-automation-conflict-sim-mcp",
  "title": "Automation Conflict Simulator",
  "description": "Simulate automation conflict by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "automation_conflict_sim",
  "entity": "automation rule simulation",
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
    "id": "conflict_count",
    "label": "Rule conflicts",
    "unit": "conflicts",
    "target": 0,
    "direction": "lower"
  },
  "target": {
    "maxItems": 25,
    "budget": 300,
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
      "id": "automation_conflict_sim-porch",
      "name": "Porch lights",
      "category": "lighting",
      "tags": [
        "outdoor",
        "sunset"
      ],
      "cost": 40,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "automation_conflict_sim-hallway",
      "name": "Hallway lights",
      "category": "lighting",
      "tags": [
        "indoor",
        "motion"
      ],
      "cost": 35,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "automation_conflict_sim-thermostat",
      "name": "Thermostat schedule",
      "category": "climate",
      "tags": [
        "heating",
        "schedule"
      ],
      "cost": 180,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "automation_conflict_sim-lock",
      "name": "Door lock",
      "category": "security",
      "tags": [
        "lock",
        "arrival"
      ],
      "cost": 220,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "automation_conflict_sim-movie",
      "name": "Movie scene",
      "category": "scene",
      "tags": [
        "media",
        "evening"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "automation_conflict_sim-morning",
      "name": "Morning routine",
      "category": "schedule",
      "tags": [
        "morning",
        "lighting"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "good"
    }
  ]
}
