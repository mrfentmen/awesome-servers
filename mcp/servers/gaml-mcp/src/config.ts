import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gaml",
  "displayName": "GAML",
  "version": "1.0.0",
  "extensions": [
    ".gaml"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "model",
      "pattern": "^\\s*model\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.gaml",
      "content": "model demo\n\nglobal {\n  int value <- 1;\n}\n"
    },
    {
      "path": "tests/run.gaml",
      "content": "model demo\n\nglobal {\n  int value <- 1;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "model demo\n\nglobal {\n  int value <- 1;\n}\n"
    }
  },
  "reference": "GAML syntax reference\n- Example: model demo\n- Comment: //\n- Run: gama {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
