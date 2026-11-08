import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "coldfusion-cfc",
  "displayName": "ColdFusion CFC",
  "version": "1.0.0",
  "extensions": [
    ".cfc"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.cfc",
      "content": "component {\n  function add(a, b) {\n    return a + b;\n  }\n}\n"
    },
    {
      "path": "tests/run.cfc",
      "content": "component {\n  function add(a, b) {\n    return a + b;\n  }\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "component {\n  function add(a, b) {\n    return a + b;\n  }\n}\n"
    }
  },
  "reference": "ColdFusion CFC syntax reference\n- Example: component {\n- Comment: //\n- No CLI runner configured",
  "blockComment": {
    "start": "<!---",
    "end": "--->"
  }
}
