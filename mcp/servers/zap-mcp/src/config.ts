import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "zap",
  "displayName": "ZAP",
  "version": "1.0.0",
  "extensions": [
    ".zap",
    ".xzap"
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
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*(?:var|let)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "require",
      "pattern": "^\\s*(?:require|import)\\s+[\"']([^\"']+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.zap",
      "content": "function add(a, b) {\n  return a + b;\n}\n"
    },
    {
      "path": "tests/run.zap",
      "content": "function add(a, b) {\n  return a + b;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function name(value) {\n  return value + 1;\n}"
    }
  },
  "reference": "ZAP syntax reference\n- Function: function name(value) { return value + 1; }\n- Class: class Name { ... }\n- Variable: var value = 1\n- Import: import \"module\"\n- Conditional: if (condition) { ... }\n- Loop: for (var i = 0; i < 10; i++) { ... }\n- Comment: // line; /* block */\n- Run: zap file.zap",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
