import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "fish",
  "displayName": "Fish",
  "version": "1.0.0",
  "extensions": [
    ".fish"
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
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*set\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "alias",
      "pattern": "^\\s*alias\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    }
  ],
  "imports": [
    {
      "kind": "source",
      "pattern": "^\\s*source\\s+([^\\s]+)"
    }
  ],
  "runner": [
    {
      "command": "fish",
      "args": [
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "fish",
      "args": [
        "tests/run.fish"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "hello.fish",
      "content": "#!/usr/bin/env fish\necho \"Hello from Fish\"\n"
    },
    {
      "path": "tests/run.fish",
      "content": "test (math 2 + 2) -eq 4; or exit 1\necho \"ok\"\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function name\n  echo \"hello\"\nend"
    },
    "conditional": {
      "description": "conditional",
      "body": "if test -n \"$value\"\n  echo \"$value\"\nend"
    },
    "loop": {
      "description": "loop",
      "body": "for item in a b c\n  echo \"$item\"\nend"
    }
  },
  "reference": "Fish syntax reference\n- Function: function name; echo \"hello\"; end\n- Variable: set name value\n- Condition: if test -n \"$value\"; ...; end\n- Loop: for item in a b c; ...; end\n- Command substitution: (command)\n- Source: source file.fish\n- Comment: # line\n- Run: fish script.fish"
}
