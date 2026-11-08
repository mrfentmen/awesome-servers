import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "shell",
  "displayName": "Shell",
  "version": "1.0.0",
  "extensions": [
    ".sh",
    ".bash",
    ".zsh",
    ".ksh"
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
      "pattern": "^\\s*(?:function\\s+)?([A-Za-z_][A-Za-z0-9_]*)\\s*\\(\\)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)="
    },
    {
      "kind": "alias",
      "pattern": "^\\s*alias\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    }
  ],
  "imports": [
    {
      "kind": "source",
      "pattern": "^\\s*(?:source|\\.)\\s+([^\\s]+)"
    }
  ],
  "runner": [
    {
      "command": "bash",
      "args": [
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "bash",
      "args": [
        "tests/run.sh"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "hello.sh",
      "content": "#!/usr/bin/env bash\nset -euo pipefail\necho \"Hello from Shell\"\n"
    },
    {
      "path": "tests/run.sh",
      "content": "#!/usr/bin/env bash\nset -euo pipefail\ntest $((2 + 2)) -eq 4\necho \"ok\"\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "name() {\n  echo \"hello\"\n}"
    },
    "conditional": {
      "description": "conditional",
      "body": "if [[ -n \"$value\" ]]; then\n  echo \"$value\"\nfi"
    },
    "loop": {
      "description": "loop",
      "body": "for item in a b c; do\n  echo \"$item\"\ndone"
    }
  },
  "reference": "Shell syntax reference\n- Function: name() { echo \"hello\"; }\n- Variable: NAME=value; export NAME\n- Condition: if [[ -n \"$value\" ]]; then ... fi\n- Loop: for item in a b c; do ... done\n- Case: case \"$value\" in a) ... ;; esac\n- Source: source file.sh or . file.sh\n- Comment: # line\n- Run: bash script.sh"
}
