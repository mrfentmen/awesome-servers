import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "zeek",
  "displayName": "Zeek",
  "version": "1.0.0",
  "extensions": [
    ".zeek",
    ".bro"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "event",
      "pattern": "^\\s*event\\s+([A-Za-z_][A-Za-z0-9_:]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_:]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "load",
      "pattern": "^\\s*@load\\s+([A-Za-z_][A-Za-z0-9_./-]*)"
    }
  ],
  "scaffold": [
    {
      "path": "scripts/demo.zeek",
      "content": "module Demo;\n\nevent zeek_init() {\n  print 2 + 2;\n}\n"
    },
    {
      "path": "tests/run.zeek",
      "content": "module Run;\n\nevent zeek_init() {\n  terminate();\n}\n"
    }
  ],
  "snippets": {
    "event": {
      "description": "event",
      "body": "event zeek_init() {\n  print 1;\n}"
    },
    "function": {
      "description": "function",
      "body": "function name(value: count): count {\n  return value + 1;\n}"
    },
    "module": {
      "description": "module",
      "body": "module Name;"
    }
  },
  "reference": "Zeek syntax reference\n- Module: module Name;\n- Event: event zeek_init() { ... }\n- Function: function name(value: count): count { return value; }\n- Type: type Name: record { value: count; };\n- Global: global value: count = 0;\n- Print: print 1;\n- Load: @load base/frameworks/notice\n- Comment: # line\n- Run: zeek scripts/file.zeek"
}
