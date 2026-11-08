import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "tcsh",
  "displayName": "Tcsh",
  "version": "1.0.0",
  "extensions": [
    ".tcsh",
    ".csh"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "alias",
      "pattern": "^\\s*alias\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*set\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "environment",
      "pattern": "^\\s*setenv\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "loop",
      "pattern": "^\\s*foreach\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "command": "tcsh",
      "args": [
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "tcsh",
      "args": [
        "tests/run.tcsh"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "hello.tcsh",
      "content": "#!/bin/tcsh\nset name = \"Bond\"\necho \"Hello, $name\"\n"
    },
    {
      "path": "tests/run.tcsh",
      "content": "#!/bin/tcsh\nif (2 + 2 == 4) then\n  echo \"ok\"\nelse\n  exit 1\nendif\n"
    }
  ],
  "snippets": {
    "alias": {
      "description": "alias",
      "body": "alias greet 'echo hello'"
    },
    "loop": {
      "description": "foreach loop",
      "body": "foreach item (a b c)\n  echo $item\nend"
    },
    "conditional": {
      "description": "if block",
      "body": "if (2 + 2 == 4) then\n  echo ok\nendif"
    }
  },
  "reference": "Tcsh syntax reference\n- Alias: alias name 'command'\n- Variable: set name = \"value\"\n- Environment: setenv NAME value\n- Loop: foreach item (a b c) ... end\n- Condition: if (expr) then ... endif\n- Source: source file.tcsh\n- Comment: # line\n- Run: tcsh script.tcsh"
}
