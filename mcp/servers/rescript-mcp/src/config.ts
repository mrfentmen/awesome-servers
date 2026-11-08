import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "rescript",
  "displayName": "ReScript",
  "version": "1.0.0",
  "extensions": [
    ".res",
    ".resi"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*let\\s+([a-z][A-Za-z0-9_']*)\\s*="
    },
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Z][A-Za-z0-9_']*)\\s*="
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([a-z][A-Za-z0-9_']*)"
    },
    {
      "kind": "external",
      "pattern": "^\\s*external\\s+([a-z][A-Za-z0-9_']*)"
    }
  ],
  "imports": [
    {
      "kind": "open",
      "pattern": "^\\s*open\\s+([A-Z][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/Demo.res",
      "content": "let add = (a, b) => a + b\n\nJs.log(add(2, 2))\n"
    },
    {
      "path": "tests/DemoTest.res",
      "content": "let value = 2 + 2\n\nJs.log(value)\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "let name = value => value + 1"
    },
    "module": {
      "description": "module",
      "body": "module Name = {\n  let value = 1\n}"
    },
    "type": {
      "description": "type",
      "body": "type name = int"
    }
  },
  "reference": "ReScript syntax reference\n- Function: let name = value => value + 1\n- Module: module Name = { let value = 1 }\n- Type: type name = int\n- Variant: type name = One | Two\n- Switch: switch value { | One => 1 | Two => 2 }\n- External: external name: int => int = \"name\"\n- Open: open Module\n- Comment: // line; /* block */\n- Build: rescript build"
}
