import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "jolie",
  "displayName": "Jolie",
  "version": "1.0.0",
  "extensions": [
    ".ol",
    ".iol"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "interface",
      "pattern": "^\\s*interface\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "service",
      "pattern": "^\\s*service\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*include\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.ol",
      "content": "interface Demo {\n  RequestResponse: add(int)(int)\n}\n"
    },
    {
      "path": "tests/run.ol",
      "content": "interface Demo {\n  RequestResponse: add(int)(int)\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "interface Name {\n  RequestResponse: value(int)(int)\n}"
    }
  },
  "reference": "Jolie syntax reference\n- Interface: interface Name { RequestResponse: value(int)(int) }\n- Service: service Name { ... }\n- Type: type Name: int { ... }\n- Include: include \"file.iol\"\n- Operation: value(int)(int)\n- Variable: value = 1\n- Comment: // line; /* block */\n- Run: jolie file.ol",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
