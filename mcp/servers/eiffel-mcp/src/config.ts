import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "eiffel",
  "displayName": "Eiffel",
  "version": "1.0.0",
  "extensions": [
    ".e"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^\\s*(?:deferred\\s+)?class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "feature",
      "pattern": "^\\s*([a-z][A-Za-z0-9_]*)\\s*\\([^)]*\\)\\s*:"
    },
    {
      "kind": "function",
      "pattern": "^\\s*([a-z][A-Za-z0-9_]*)\\s*:"
    }
  ],
  "imports": [
    {
      "kind": "inherit",
      "pattern": "^\\s*inherit\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "create",
      "pattern": "^\\s*create\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.e",
      "content": "class DEMO\n\nfeature\n\n  add (a, b: INTEGER): INTEGER\n    do\n      Result := a + b\n    end\n\nend\n"
    },
    {
      "path": "tests/run.e",
      "content": "class TEST\n\nfeature\n\n  run\n    do\n      print (\"ok%\")\n    end\n\nend\n"
    }
  ],
  "snippets": {
    "class": {
      "description": "class",
      "body": "class NAME\n\nfeature\n\nend"
    },
    "feature": {
      "description": "feature",
      "body": "  name (value: INTEGER): INTEGER\n    do\n      Result := value\n    end"
    },
    "loop": {
      "description": "loop",
      "body": "  from\n    i := 1\n  until\n    i > 10\n  loop\n    i := i + 1\n  end"
    }
  },
  "reference": "Eiffel syntax reference\n- Class: class NAME ... end\n- Feature block: feature ...\n- Feature: name (value: INTEGER): INTEGER do Result := value end\n- Local: local name: INTEGER\n- Conditional: if condition then ... else ... end\n- Loop: from ... until ... loop ... end\n- Inherit: inherit OTHER\n- Create: create name\n- Comment: -- line\n- Compile: ec file.e"
}
