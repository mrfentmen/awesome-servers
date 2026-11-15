import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "disaster-family-reunify-cost-mcp",
  "title": "Family Reunification Budget Audit",
  "description": "Audit family reunification budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "family_reunify_budget",
  "entity": "reunification item budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 50,
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
      "id": "family_reunify_budget-emergency-contact-card",
      "name": "Emergency contact card",
      "category": "contact",
      "tags": [
        "budget"
      ],
      "cost": 5,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "family_reunify_budget-neighborhood-meeting-point",
      "name": "Neighborhood meeting point",
      "category": "meeting",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "family_reunify_budget-document-pouch",
      "name": "Document pouch",
      "category": "document",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "new"
    },
    {
      "id": "family_reunify_budget-backup-route",
      "name": "Backup route",
      "category": "transport",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "family_reunify_budget-check-in-schedule",
      "name": "Check-in schedule",
      "category": "checkin",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "family_reunify_budget-school-pickup-plan",
      "name": "School pickup plan",
      "category": "transport",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
