import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "harbour",
  "displayName": "Harbour",
  "version": "1.0.0",
  "extensions": [
    ".hb"
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
      "path": "src/demo.hb",
      "content": "function Main()\n  ? \"Hello\"\n  return nil\n"
    },
    {
      "path": "tests/run.hb",
      "content": "function Main()\n  ? \"Hello\"\n  return nil\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function Main()\n  ? \"Hello\"\n  return nil\n"
    }
  },
  "reference": "Harbour syntax reference\n- Example: function Main()\n- Comment: //\n- Run: harbour {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
