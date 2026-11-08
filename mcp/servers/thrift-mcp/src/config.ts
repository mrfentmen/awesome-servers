import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "thrift",
  "displayName": "Thrift",
  "version": "1.0.0",
  "extensions": [
    ".thrift"
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
      "kind": "namespace",
      "pattern": "^\\s*namespace\\s+\\w+\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "service",
      "pattern": "^\\s*service\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "enum",
      "pattern": "^\\s*enum\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "exception",
      "pattern": "^\\s*exception\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "src/demo.thrift",
      "content": "namespace js demo\n\nstruct Demo {\n  1: i32 value\n}\n"
    },
    {
      "path": "tests/run.thrift",
      "content": "namespace js test\n\nstruct Test {\n  1: i32 value\n}\n"
    }
  ],
  "snippets": {
    "struct": {
      "description": "struct",
      "body": "struct Name {\n  1: i32 value\n}"
    },
    "service": {
      "description": "service",
      "body": "service Name {\n  i32 value()\n}"
    },
    "enum": {
      "description": "enum",
      "body": "enum Name {\n  VALUE = 1\n}"
    }
  },
  "reference": "Thrift syntax reference\n- Namespace: namespace js demo\n- Struct: struct Name { 1: i32 value }\n- Service: service Name { i32 value() }\n- Enum: enum Name { VALUE = 1 }\n- Exception: exception Name { 1: string message }\n- Typedef: typedef i32 Name\n- Include: include \"file.thrift\"\n- Comment: // line; /* block */\n- Build: thrift --gen js file.thrift"
}
