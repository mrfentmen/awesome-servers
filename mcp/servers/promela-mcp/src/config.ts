import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "promela",
  "displayName": "Promela",
  "version": "1.0.0",
  "extensions": [
    ".pml"
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
      "kind": "process",
      "pattern": "^\\s*(?:active\\s+)?proctype\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "inline",
      "pattern": "^\\s*inline\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "mtype",
      "pattern": "^\\s*mtype\\s+([A-Za-z_][A-Za-z0-9_, ]*)"
    },
    {
      "kind": "channel",
      "pattern": "^\\s*chan\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*#include\\s+\"([^\"]+)\""
    }
  ],
  "scaffold": [
    {
      "path": "models/demo.pml",
      "content": "proctype Demo() {\n  assert(2 + 2 == 4);\n}\n\ninit {\n  run Demo()\n}\n"
    },
    {
      "path": "tests/run.pml",
      "content": "init {\n  assert(2 + 2 == 4);\n}\n"
    }
  ],
  "snippets": {
    "process": {
      "description": "process",
      "body": "proctype Name() {\n  assert(true);\n}"
    },
    "inline": {
      "description": "inline",
      "body": "inline name() {\n  skip\n}"
    },
    "channel": {
      "description": "channel",
      "body": "chan value = [0] of { int };"
    }
  },
  "reference": "Promela syntax reference\n- Process: proctype Name() { ... }\n- Active: active proctype Name() { ... }\n- Inline: inline name() { ... }\n- Channel: chan value = [0] of { int };\n- Send: value ! 1\n- Receive: value ? x\n- Init: init { run Name() }\n- Include: #include \"file.pml\"\n- Comment: // line; /* block */"
}
