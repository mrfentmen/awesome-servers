import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "xonsh",
  "displayName": "Xonsh",
  "version": "1.0.0",
  "extensions": [
    ".xsh"
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
      "pattern": "^\\s*def\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "alias",
      "pattern": "^\\s*aliases\\[['\"]([^'\"]+)['\"]\\]"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z0-9_.]+)"
    },
    {
      "kind": "from",
      "pattern": "^\\s*from\\s+([A-Za-z0-9_.]+)\\s+import"
    }
  ],
  "runner": [
    {
      "command": "xonsh",
      "args": [
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "xonsh",
      "args": [
        "tests/run.xsh"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "hello.xsh",
      "content": "print(\"Hello from Xonsh\")\n"
    },
    {
      "path": "tests/run.xsh",
      "content": "assert 2 + 2 == 4\nprint(\"ok\")\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def name(value):\n    return value + 1"
    },
    "shell": {
      "description": "shell command",
      "body": "echo @(value)"
    },
    "alias": {
      "description": "alias",
      "body": "aliases['name'] = 'command'"
    }
  },
  "reference": "Xonsh syntax reference\n- Function: def name(value): return value + 1\n- Class: class Name: ...\n- Python expression: 2 + 2\n- Shell command: echo hello\n- Capture: $(command)\n- Environment: $NAME = 'value'\n- Alias: aliases['name'] = 'command'\n- Import: import os; from pathlib import Path\n- Comment: # line\n- Run: xonsh script.xsh"
}
