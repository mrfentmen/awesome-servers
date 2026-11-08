import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "groovy-server-pages",
  "displayName": "Groovy Server Pages",
  "version": "1.0.0",
  "extensions": [
    ".gsp"
  ],
  "markers": [],
  "comment": "<%--",
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
      "path": "src/demo.gsp",
      "content": "<html>\n<body>\n<g:each in=\"${items}\" var=\"item\">${item}</g:each>\n</body>\n</html>\n"
    },
    {
      "path": "tests/run.gsp",
      "content": "<html>\n<body>\n<g:each in=\"${items}\" var=\"item\">${item}</g:each>\n</body>\n</html>\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "<html>\n<body>\n<g:each in=\"${items}\" var=\"item\">${item}</g:each>\n</body>\n</html>\n"
    }
  },
  "reference": "Groovy Server Pages syntax reference\n- Example: <html>\n- Comment: <%--\n- No CLI runner configured",
  "blockComment": {
    "start": "<%--",
    "end": "--%>"
  }
}
