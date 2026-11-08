import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gn",
  "displayName": "GN",
  "version": "1.0.0",
  "extensions": [
    ".gn"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "template",
      "pattern": "^\\s*template\\(\"([^\"]+)\"\\)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.gn",
      "content": "template(\"demo\") {\n  source = \"demo.cc\"\n}\n"
    },
    {
      "path": "tests/run.gn",
      "content": "template(\"demo\") {\n  source = \"demo.cc\"\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "template(\"demo\") {\n  source = \"demo.cc\"\n}\n"
    }
  },
  "reference": "GN syntax reference\n- Example: template(\"demo\") {"
}
