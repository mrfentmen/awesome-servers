import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "just",
  "displayName": "Just",
  "version": "1.0.0",
  "extensions": [
    ".just"
  ],
  "markers": [
    "justfile",
    ".justfile"
  ],
  "comment": "#",
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "recipe",
      "pattern": "^([A-Za-z_][A-Za-z0-9_-]*):"
    },
    {
      "kind": "alias",
      "pattern": "^\\s*alias\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_-]*)\\s*:="
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+['\"]?([^'\"\\s]+)"
    },
    {
      "kind": "module",
      "pattern": "^\\s*mod\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    }
  ],
  "runner": [
    {
      "command": "just",
      "args": [
        "--justfile",
        "{file}",
        "--list"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "justfile",
      "content": "greet:\n    @echo \"Hello from Just\"\n\ntest:\n    @echo ok\n"
    },
    {
      "path": "tests/run.just",
      "content": "smoke:\n    @echo ok\n"
    }
  ],
  "snippets": {
    "recipe": {
      "description": "recipe",
      "body": "name:\n    @echo \"Hello\""
    },
    "variable": {
      "description": "variable",
      "body": "name := \"value\""
    },
    "alias": {
      "description": "alias",
      "body": "alias b := build"
    }
  },
  "reference": "Just syntax reference\n- Recipe: name:\n- Body: indented shell lines\n- Quiet: @echo \"text\"\n- Variable: name := \"value\"\n- Alias: alias b := build\n- Parameter: recipe arg:\n- Dependency: recipe: other\n- Import: import 'file.just'\n- List recipes: just --list"
}
