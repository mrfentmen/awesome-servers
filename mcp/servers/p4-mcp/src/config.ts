import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "p4",
  "displayName": "P4",
  "version": "1.0.0",
  "extensions": [
    ".p4"
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
      "kind": "header",
      "pattern": "^\\s*header\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "parser",
      "pattern": "^\\s*parser\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "control",
      "pattern": "^\\s*control\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "action",
      "pattern": "^\\s*action\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "table",
      "pattern": "^\\s*table\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*#include\\s+[\"<]([^\">]+)[\">]"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.p4",
      "content": "header Demo_t {\n  bit<8> value;\n}\n\ncontrol Demo() {\n  apply {\n  }\n}\n"
    },
    {
      "path": "tests/run.p4",
      "content": "header Test_t {\n  bit<8> value;\n}\n"
    }
  ],
  "snippets": {
    "header": {
      "description": "header",
      "body": "header Name_t {\n  bit<8> value;\n}"
    },
    "control": {
      "description": "control",
      "body": "control Name() {\n  apply {\n  }\n}"
    },
    "table": {
      "description": "table",
      "body": "table name {\n  key = { }\n  actions = { }\n}"
    }
  },
  "reference": "P4 syntax reference\n- Header: header Name_t { bit<8> value; }\n- Parser: parser Name(packet_in p, out Header h) { state start { } }\n- Control: control Name() { apply { } }\n- Action: action name() { }\n- Table: table name { key = { } actions = { } }\n- Include: #include <core.p4>\n- Variable: bit<8> value = 0;\n- Comment: // line; /* block */\n- Compile: p4c file.p4"
}
