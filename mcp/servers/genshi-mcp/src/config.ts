import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "genshi",
  "displayName": "Genshi",
  "version": "1.0.0",
  "extensions": [
    ".kid"
  ],
  "markers": [],
  "comment": "<!--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "element",
      "pattern": "<([a-z][\\w-]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.kid",
      "content": "<html xmlns:py=\"http://genshi.edgewall.org/\">\n  <p py:content=\"value\">text</p>\n</html>\n"
    },
    {
      "path": "tests/run.kid",
      "content": "<html xmlns:py=\"http://genshi.edgewall.org/\">\n  <p py:content=\"value\">text</p>\n</html>\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "<html xmlns:py=\"http://genshi.edgewall.org/\">\n  <p py:content=\"value\">text</p>\n</html>\n"
    }
  },
  "reference": "Genshi syntax reference\n- Example: <html xmlns:py=\"http://genshi.edgewall.org/\">\n- Comment: <!--\n- No CLI runner configured",
  "blockComment": {
    "start": "<!--",
    "end": "-->"
  }
}
