import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "accessibility-contrast-audit-check-mcp",
  "title": "Contrast Audit",
  "description": "Audit UI contrast ratios for text, icons, buttons and form controls against a 4.5:1 target. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "contrast_audit",
  "entity": "UI element",
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
      "condition": "good"
    },
    {
      "id": "contrast-muted",
      "name": "Muted text",
      "category": "text",
      "tags": [
        "secondary"
      ],
      "quantity": 4.6,
      "condition": "good"
    },
    {
      "id": "contrast-icon",
      "name": "Toolbar icon",
      "category": "icon",
      "tags": [
        "outline"
      ],
      "quantity": 3.1,
      "condition": "fair"
    },
    {
      "id": "contrast-button",
      "name": "Primary button",
      "category": "button",
      "tags": [
        "filled"
      ],
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "contrast-border",
      "name": "Input border",
      "category": "form",
      "tags": [
        "border"
      ],
      "quantity": 2.8,
      "condition": "worn"
    },
    {
      "id": "contrast-placeholder",
      "name": "Placeholder text",
      "category": "form",
      "tags": [
        "hint"
      ],
      "quantity": 3.4,
      "condition": "fair"
    }
  ]
}
