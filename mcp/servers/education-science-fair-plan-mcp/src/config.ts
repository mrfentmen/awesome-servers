import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "education-science-fair-plan-mcp",
  "title": "Science Fair Planning Audit",
  "description": "Plan science fair by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "science_fair_plan",
  "entity": "science fair project part plan",
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
      "id": "science_fair_plan-plant-light-question",
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
      "id": "science_fair_plan-paper-bridge-method",
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
      "id": "science_fair_plan-variables-table",
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
      "id": "science_fair_plan-growth-measurements",
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
      "id": "science_fair_plan-bridge-load-trials",
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
      "id": "science_fair_plan-tri-fold-layout",
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
      "id": "science_fair_plan-graph-labels",
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
      "id": "science_fair_plan-safety-checklist",
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
