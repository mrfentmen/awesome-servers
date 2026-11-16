import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "accessibility-screen-reader-cost-mcp",
  "title": "Screen Reader Budget Audit",
  "description": "Audit screen reader budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "screen_reader_budget",
  "entity": "screen reader target budget line",
  "categories": [
    {
      "id": "heading",
      "label": "Headings",
      "baseline": 3
    },
    {
      "id": "form",
      "label": "Forms",
      "baseline": 3
    },
    {
      "id": "image",
      "label": "Images",
      "baseline": 2
    },
    {
      "id": "button",
      "label": "Buttons",
      "baseline": 2
    },
    {
      "id": "landmark",
      "label": "Landmarks",
      "baseline": 2
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
    "budget": 100,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "structure",
      "label": "Page structure",
      "categories": [
        "heading",
        "landmark"
      ]
    },
    {
      "id": "forms",
      "label": "Form labelling",
      "categories": [
        "form"
      ]
    },
    {
      "id": "media",
      "label": "Image alternatives",
      "categories": [
        "image"
      ]
    },
    {
      "id": "actions",
      "label": "Button names",
      "categories": [
        "button"
      ]
    }
  ],
  "sample": [
    {
      "id": "screen_reader_budget-page-heading",
      "name": "Page heading",
      "category": "heading",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "screen_reader_budget-section-heading",
      "name": "Section heading",
      "category": "heading",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "screen_reader_budget-card-heading",
      "name": "Card heading",
      "category": "heading",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "screen_reader_budget-email-field",
      "name": "Email field",
      "category": "form",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "screen_reader_budget-phone-field",
      "name": "Phone field",
      "category": "form",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "screen_reader_budget-search-field",
      "name": "Search field",
      "category": "form",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "worn"
    },
    {
      "id": "screen_reader_budget-logo-image",
      "name": "Logo image",
      "category": "image",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "screen_reader_budget-chart-image",
      "name": "Chart image",
      "category": "image",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "worn"
    },
    {
      "id": "screen_reader_budget-menu-button",
      "name": "Menu button",
      "category": "button",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "screen_reader_budget-close-button",
      "name": "Close button",
      "category": "button",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "screen_reader_budget-main-landmark",
      "name": "Main landmark",
      "category": "landmark",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "screen_reader_budget-navigation-landmark",
      "name": "Navigation landmark",
      "category": "landmark",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
