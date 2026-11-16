import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "accessibility-screen-reader-check-mcp",
  "title": "Screen Reader Audit",
  "description": "Audit screen reader by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "screen_reader",
  "entity": "screen reader target",
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
    "id": "issue_count",
    "label": "Issue count",
    "unit": "issues",
    "target": 0,
    "direction": "lower"
  },
  "target": {
    "maxItems": 24,
    "budget": 200,
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
      "id": "screen_reader-h1",
      "name": "Page heading",
      "category": "heading",
      "tags": [
        "h1",
        "visible"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "screen_reader-h2",
      "name": "Section heading",
      "category": "heading",
      "tags": [
        "h2",
        "visible"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "screen_reader-h3",
      "name": "Card heading",
      "category": "heading",
      "tags": [
        "h3",
        "repeated"
      ],
      "cost": 0,
      "quantity": 3,
      "condition": "fair"
    },
    {
      "id": "screen_reader-email",
      "name": "Email field",
      "category": "form",
      "tags": [
        "label",
        "required"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "screen_reader-phone",
      "name": "Phone field",
      "category": "form",
      "tags": [
        "label",
        "optional"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "screen_reader-search",
      "name": "Search field",
      "category": "form",
      "tags": [
        "placeholder-only",
        "icon"
      ],
      "cost": 0,
      "quantity": 4,
      "condition": "worn"
    },
    {
      "id": "screen_reader-logo",
      "name": "Logo image",
      "category": "image",
      "tags": [
        "alt",
        "link"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "screen_reader-chart",
      "name": "Chart image",
      "category": "image",
      "tags": [
        "long-description",
        "data"
      ],
      "cost": 0,
      "quantity": 5,
      "condition": "worn"
    },
    {
      "id": "screen_reader-menu",
      "name": "Menu button",
      "category": "button",
      "tags": [
        "aria-expanded",
        "icon"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "screen_reader-close",
      "name": "Close button",
      "category": "button",
      "tags": [
        "aria-label",
        "icon"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "screen_reader-main",
      "name": "Main landmark",
      "category": "landmark",
      "tags": [
        "main",
        "unique"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "screen_reader-nav",
      "name": "Navigation landmark",
      "category": "landmark",
      "tags": [
        "nav",
        "labelled"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
