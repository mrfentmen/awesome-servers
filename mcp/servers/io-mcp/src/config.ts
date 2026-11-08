import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "io",
  "displayName": "Io",
  "version": "1.0.0",
  "extensions": [
    ".io"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "object",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*:=\\s*Object"
    },
    {
      "kind": "method",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*:=\\s*method"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*:="
    }
  ],
  "imports": [
    {
      "kind": "doFile",
      "pattern": "doFile\\s*\\(\\s*\"([^\"]+)"
    },
    {
      "kind": "import",
      "pattern": "Importer\\s+import\\s*\\(\\s*\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.io",
      "content": "Demo := Object clone\nDemo add := method(a, b, a + b)\nDemo add(2, 2) println\n"
    },
    {
      "path": "tests/run.io",
      "content": "if(2 + 2 != 4, Exception raise(\"math failed\"))\n\"ok\" println\n"
    }
  ],
  "snippets": {
    "object": {
      "description": "object",
      "body": "Name := Object clone"
    },
    "method": {
      "description": "method",
      "body": "Name method := method(value, value + 1)"
    },
    "loop": {
      "description": "loop",
      "body": "for(i, 1, 10, i println)"
    }
  },
  "reference": "Io syntax reference\n- Object: Name := Object clone\n- Method: Name add := method(a, b, a + b)\n- Variable: name := 1\n- Call: Name add(2, 2) println\n- Conditional: if(condition, then, else)\n- Loop: for(i, 1, 10, i println)\n- List: list(1, 2, 3)\n- Map: map(1, 2) map(x, x + 1)\n- Comment: // line; /* block */\n- Run: io file.io"
}
