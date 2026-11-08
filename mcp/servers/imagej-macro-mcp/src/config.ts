import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "imagej-macro",
  "displayName": "ImageJ Macro",
  "version": "1.0.0",
  "extensions": [
    ".ijm"
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
      "path": "src/demo.ijm",
      "content": "function add(a, b) {\n  return a + b;\n}\n"
    },
    {
      "path": "tests/run.ijm",
      "content": "function add(a, b) {\n  return a + b;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function add(a, b) {\n  return a + b;\n}\n"
    }
  },
  "reference": "ImageJ Macro syntax reference\n- Example: function add(a, b) {\n- Comment: //\n- Run: imagej --headless {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
