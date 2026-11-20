import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "stargazing-meteor-shower-watch-sim-mcp",
  "title": "Meteor Shower Watch Simulator",
  "description": "Real local JSON analysis of meteor shower watch in the Stargazing lane. 25 MCP tools, no paywall.",
  "prefix": "stargazing_stargazing_meteor_shower_watch_sim",
  "entity": "meteor shower watch item",
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
      "id": "stargazing_stargazing_meteor_shower_watch_sim-inputs-1",
      "name": "Inputs primary",
      "category": "inputs",
      "tags": [
        "stargazing",
        "stargazing",
        "meteor"
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
      "id": "stargazing_stargazing_meteor_shower_watch_sim-scenarios-2",
      "name": "Scenarios primary",
      "category": "scenarios",
      "tags": [
        "stargazing",
        "stargazing",
        "meteor"
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
      "id": "stargazing_stargazing_meteor_shower_watch_sim-outputs-3",
      "name": "Outputs primary",
      "category": "outputs",
      "tags": [
        "stargazing",
        "stargazing",
        "meteor"
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
      "id": "stargazing_stargazing_meteor_shower_watch_sim-assumptions-4",
      "name": "Assumptions primary",
      "category": "assumptions",
      "tags": [
        "stargazing",
        "stargazing",
        "meteor"
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
      "id": "stargazing_stargazing_meteor_shower_watch_sim-inputs-5",
      "name": "Inputs backup",
      "category": "inputs",
      "tags": [
        "stargazing",
        "stargazing",
        "meteor"
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
      "id": "stargazing_stargazing_meteor_shower_watch_sim-scenarios-6",
      "name": "Scenarios backup",
      "category": "scenarios",
      "tags": [
        "stargazing",
        "stargazing",
        "meteor"
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
      "id": "stargazing_stargazing_meteor_shower_watch_sim-outputs-7",
      "name": "Outputs backup",
      "category": "outputs",
      "tags": [
        "stargazing",
        "stargazing",
        "meteor"
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
      "id": "stargazing_stargazing_meteor_shower_watch_sim-assumptions-8",
      "name": "Assumptions backup",
      "category": "assumptions",
      "tags": [
        "stargazing",
        "stargazing",
        "meteor"
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
