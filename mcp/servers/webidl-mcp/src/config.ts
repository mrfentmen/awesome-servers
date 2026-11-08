import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "webidl",
  "displayName": "WebIDL",
  "version": "1.0.0",
  "extensions": [
    ".webidl"
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
      "kind": "interface",
      "pattern": "^\\s*(?:partial\\s+)?interface\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "dictionary",
      "pattern": "^\\s*dictionary\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "enum",
      "pattern": "^\\s*enum\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "callback",
      "pattern": "^\\s*callback\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "namespace",
      "pattern": "^\\s*namespace\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.webidl",
      "content": "interface Demo {\n  readonly attribute long value;\n};\n"
    },
    {
      "path": "tests/run.webidl",
      "content": "dictionary Test {\n  long value;\n};\n"
    }
  ],
  "snippets": {
    "interface": {
      "description": "interface",
      "body": "interface Name {\n  readonly attribute long value;\n};"
    },
    "dictionary": {
      "description": "dictionary",
      "body": "dictionary Name {\n  long value;\n};"
    },
    "enum": {
      "description": "enum",
      "body": "enum Name { \"one\", \"two\" };"
    }
  },
  "reference": "WebIDL syntax reference\n- Interface: interface Name { readonly attribute long value; };\n- Dictionary: dictionary Name { long value; };\n- Enum: enum Name { \"one\", \"two\" };\n- Callback: callback Name = void (long value);\n- Namespace: namespace Name { };\n- Partial: partial interface Name { };\n- Comment: // line; /* block */\n- Validate: webidl2js file.webidl"
}
