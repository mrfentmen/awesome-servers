import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ragel",
  "displayName": "Ragel",
  "version": "1.0.0",
  "extensions": [
    ".rl"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "machine",
      "pattern": "^\\s*machine\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "action",
      "pattern": "^\\s*action\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "rule",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*:="
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.rl",
      "content": "%%{\n  machine demo;\n  main := 'a'+;\n}%%\n"
    },
    {
      "path": "tests/run.rl",
      "content": "%%{\n  machine demo;\n  main := 'a'+;\n}%%\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "%%{\n  machine name;\n  main := 'a'+;\n}%%"
    }
  },
  "reference": "Ragel syntax reference\n- Machine: machine name;\n- Rule: main := 'a'+;\n- Action: action name { ... }\n- Include: include name;\n- Define: name = 'a';\n- Comment: # line\n- Run: ragel file.rl"
}
