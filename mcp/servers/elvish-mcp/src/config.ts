import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "elvish",
  "displayName": "Elvish",
  "version": "1.0.0",
  "extensions": [
    ".elv"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*fn\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*(?:var|set)\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Za-z0-9_./-]+)"
    }
  ],
  "runner": [
    {
      "command": "elvish",
      "args": [
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "elvish",
      "args": [
        "tests/run.elv"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "hello.elv",
      "content": "echo \"Hello from Elvish\"\n"
    },
    {
      "path": "tests/run.elv",
      "content": "if (== 2 2) { echo ok } else { fail bad-math }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fn name { |value|\n  echo $value\n}"
    },
    "variable": {
      "description": "variable",
      "body": "var value = 42"
    },
    "pipeline": {
      "description": "pipeline",
      "body": "echo hello | str:to-upper"
    }
  },
  "reference": "Elvish syntax reference\n- Function: fn name { |value| echo $value }\n- Variable: var value = 42; set value = 43\n- Lambda: { |x| + $x 1 }\n- Pipeline: echo hello | str:to-upper\n- List: [a b c]\n- Map: [&key=value]\n- Import: use str\n- Comment: # line\n- Run: elvish script.elv"
}
