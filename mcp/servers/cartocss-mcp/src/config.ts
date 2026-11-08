import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cartocss",
  "displayName": "CartoCSS",
  "version": "1.0.0",
  "extensions": [
    ".mss"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "selector",
      "pattern": "^#([A-Za-z0-9_-]+)\\s*\\{"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.mss",
      "content": "#roads {\n  line-color: #fff;\n}\n"
    },
    {
      "path": "tests/run.mss",
      "content": "#roads {\n  line-color: #fff;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "#roads {\n  line-color: #fff;\n}\n"
    }
  },
  "reference": "CartoCSS syntax reference\n- Example: #roads {\n- Comment: //\n- Run: carto {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
