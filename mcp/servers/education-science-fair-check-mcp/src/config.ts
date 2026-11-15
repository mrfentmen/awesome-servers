import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "education-science-fair-check-mcp",
  "title": "Science Fair Audit",
  "description": "Audit science fair questions, methods, data, displays and safety checks against a project rubric. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "science_fair",
  "entity": "science fair project part",
  "categories": [
    {
      "id": "question",
      "label": "Question",
      "baseline": 1
    },
    {
      "id": "method",
      "label": "Method",
      "baseline": 2
    },
    {
      "id": "data",
      "label": "Data",
      "baseline": 2
    },
    {
      "id": "display",
      "label": "Display",
      "baseline": 2
    },
    {
      "id": "safety",
      "label": "Safety",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "rubric_score",
    "label": "Rubric score",
    "unit": "%",
    "target": 80,
    "direction": "higher"
  },
  "target": {
    "maxItems": 30,
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "question",
      "label": "Question",
      "categories": [
        "question"
      ]
    },
    {
      "id": "method",
      "label": "Method",
      "categories": [
        "method"
      ]
    },
    {
      "id": "data",
      "label": "Data",
      "categories": [
        "data"
      ]
    },
    {
      "id": "display",
      "label": "Display",
      "categories": [
        "display"
      ]
    },
    {
      "id": "safety",
      "label": "Safety",
      "categories": [
        "safety"
      ]
    }
  ],
  "sample": [
    {
      "id": "science_fair-plant-light-question",
      "name": "Plant light question",
      "category": "question",
      "tags": [
        "question",
        "biology"
      ],
      "cost": 0,
      "quantity": 88,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "new"
    },
    {
      "id": "science_fair-paper-bridge-method",
      "name": "Paper bridge method",
      "category": "method",
      "tags": [
        "method",
        "engineering"
      ],
      "cost": 12,
      "quantity": 84,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "science_fair-variables-table",
      "name": "Variables table",
      "category": "method",
      "tags": [
        "method",
        "variables"
      ],
      "cost": 0,
      "quantity": 76,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "science_fair-growth-measurements",
      "name": "Growth measurements",
      "category": "data",
      "tags": [
        "data",
        "biology"
      ],
      "cost": 0,
      "quantity": 90,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "science_fair-bridge-load-trials",
      "name": "Bridge load trials",
      "category": "data",
      "tags": [
        "data",
        "engineering"
      ],
      "cost": 0,
      "quantity": 70,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "science_fair-tri-fold-layout",
      "name": "Tri-fold layout",
      "category": "display",
      "tags": [
        "display",
        "poster"
      ],
      "cost": 18,
      "quantity": 86,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "science_fair-graph-labels",
      "name": "Graph labels",
      "category": "display",
      "tags": [
        "display",
        "chart"
      ],
      "cost": 0,
      "quantity": 72,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "science_fair-safety-checklist",
      "name": "Safety checklist",
      "category": "safety",
      "tags": [
        "safety"
      ],
      "cost": 0,
      "quantity": 95,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "new"
    }
  ]
}
