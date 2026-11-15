import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "disaster-family-reunify-plan-mcp",
  "title": "Family Reunification Planning Audit",
  "description": "Plan family reunification by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "family_reunify_plan",
  "entity": "reunification item plan",
  "categories": [
    {
      "id": "contact",
      "label": "Contacts",
      "baseline": 1
    },
    {
      "id": "meeting",
      "label": "Meeting points",
      "baseline": 1
    },
    {
      "id": "document",
      "label": "Documents",
      "baseline": 1
    },
    {
      "id": "transport",
      "label": "Transport",
      "baseline": 1
    },
    {
      "id": "checkin",
      "label": "Check-ins",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "reach_minutes",
    "label": "Reach minutes",
    "unit": "min",
    "target": 60,
    "direction": "lower"
  },
  "target": {
    "maxItems": 15,
    "budget": 150,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "contacts",
      "label": "Contact plan",
      "categories": [
        "contact"
      ]
    },
    {
      "id": "meeting",
      "label": "Meeting plan",
      "categories": [
        "meeting"
      ]
    },
    {
      "id": "records",
      "label": "Records",
      "categories": [
        "document"
      ]
    },
    {
      "id": "movement",
      "label": "Movement plan",
      "categories": [
        "transport",
        "checkin"
      ]
    }
  ],
  "sample": [
    {
      "id": "family_reunify_plan-card",
      "name": "Emergency contact card",
      "category": "contact",
      "tags": [
        "phone",
        "laminated"
      ],
      "cost": 5,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "family_reunify_plan-point",
      "name": "Neighborhood meeting point",
      "category": "meeting",
      "tags": [
        "walkable",
        "landmark"
      ],
      "cost": 0,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "family_reunify_plan-docs",
      "name": "Document pouch",
      "category": "document",
      "tags": [
        "passport",
        "medical"
      ],
      "cost": 20,
      "quantity": 30,
      "condition": "new"
    },
    {
      "id": "family_reunify_plan-route",
      "name": "Backup route",
      "category": "transport",
      "tags": [
        "bike",
        "transit"
      ],
      "cost": 0,
      "quantity": 45,
      "condition": "fair"
    },
    {
      "id": "family_reunify_plan-checkin",
      "name": "Check-in schedule",
      "category": "checkin",
      "tags": [
        "sms",
        "hourly"
      ],
      "cost": 0,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "family_reunify_plan-school",
      "name": "School pickup plan",
      "category": "transport",
      "tags": [
        "school",
        "walk"
      ],
      "cost": 0,
      "quantity": 25,
      "condition": "good"
    }
  ]
}
