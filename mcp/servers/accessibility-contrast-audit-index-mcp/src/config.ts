import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "accessibility-contrast-audit-index-mcp",
  "title": "Contrast Archive",
  "description": "Archive contrast by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "contrast_audit_index",
  "entity": "UI element archive",
  "categories": [
    {
      "id": "text",
      "label": "Text",
      "baseline": 6
    },
    {
      "id": "icon",
      "label": "Icons",
      "baseline": 4
    },
    {
      "id": "button",
      "label": "Buttons",
      "baseline": 4
    },
    {
      "id": "form",
      "label": "Form controls",
      "baseline": 4
    }
  ],
  "metric": {
    "id": "contrast_ratio",
    "label": "Contrast ratio",
    "unit": ":1",
    "target": 4.5,
    "direction": "higher"
  },
  "target": {
    "maxItems": 30,
    "budget": null,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "text",
      "label": "Text contrast",
      "categories": [
        "text"
      ]
    },
    {
      "id": "icon",
      "label": "Icon contrast",
      "categories": [
        "icon"
      ]
    },
    {
      "id": "button",
      "label": "Button contrast",
      "categories": [
        "button"
      ]
    },
    {
      "id": "form",
      "label": "Form contrast",
      "categories": [
        "form"
      ]
    }
  ],
  "sample": [
    {
      "id": "contrast-body",
      "name": "Body text",
      "category": "text",
      "tags": [
        "paragraph"
      ],
      "quantity": 7.2,
      "condition": "good",
      "cost": 10
    },
    {
      "id": "contrast-muted",
      "name": "Muted text",
      "category": "text",
      "tags": [
        "secondary"
      ],
      "quantity": 4.6,
      "condition": "good",
      "cost": 10
    },
    {
      "id": "contrast-icon",
      "name": "Toolbar icon",
      "category": "icon",
      "tags": [
        "outline"
      ],
      "quantity": 3.1,
      "condition": "fair",
      "cost": 20
    },
    {
      "id": "contrast-button",
      "name": "Primary button",
      "category": "button",
      "tags": [
        "filled"
      ],
      "quantity": 5,
      "condition": "good",
      "cost": 15
    },
    {
      "id": "contrast-border",
      "name": "Input border",
      "category": "form",
      "tags": [
        "border"
      ],
      "quantity": 2.8,
      "condition": "worn",
      "cost": 25
    },
    {
      "id": "contrast-placeholder",
      "name": "Placeholder text",
      "category": "form",
      "tags": [
        "hint"
      ],
      "quantity": 3.4,
      "condition": "fair",
      "cost": 12
    }
  ]
}
