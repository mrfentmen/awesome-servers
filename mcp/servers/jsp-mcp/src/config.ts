import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "jsp",
  "displayName": "Java Server Pages",
  "version": "1.0.0",
  "extensions": [
    ".jsp",
    ".tag"
  ],
  "markers": [],
  "comment": "<%--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "method",
      "pattern": "\\b(?:int|void|String)\\s+([A-Za-z_]\\w*)\\s*\\("
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.jsp",
      "content": "<%\nint add(int a, int b) {\n  return a + b;\n}\n%>\n"
    },
    {
      "path": "tests/run.jsp",
      "content": "<%\nint add(int a, int b) {\n  return a + b;\n}\n%>\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "<%\nint add(int a, int b) {\n  return a + b;\n}\n%>\n"
    }
  },
  "reference": "Java Server Pages syntax reference\n- Example: <%\n- Comment: <%--\n- No CLI runner configured",
  "blockComment": {
    "start": "<%--",
    "end": "--%>"
  }
}
