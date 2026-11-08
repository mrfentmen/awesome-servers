import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "starlark",
  "displayName": "Starlark",
  "version": "1.0.0",
  "extensions": [
    ".bzl",
    ".star"
  ],
  "markers": [
    "BUILD",
    "WORKSPACE",
    "MODULE.bazel"
  ],
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
      "kind": "rule",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*rule\\s*\\("
    },
    {
      "kind": "provider",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*provider\\s*\\("
    },
    {
      "kind": "aspect",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*aspect\\s*\\("
    }
  ],
  "imports": [
    {
      "kind": "load",
      "pattern": "^\\s*load\\s*\\(\\s*\"([^\"]+)\""
    }
  ],
  "scaffold": [
    {
      "path": "defs.bzl",
      "content": "def greet(name):\n    return \"Hello, \" + name\n"
    },
    {
      "path": "BUILD",
      "content": "load(\":defs.bzl\", \"greet\")\nmessage = greet(\"Bond\")\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def name(value):\n    return value"
    },
    "rule": {
      "description": "rule",
      "body": "name = rule(\n    implementation = _impl,\n)"
    },
    "load": {
      "description": "load",
      "body": "load(\":defs.bzl\", \"name\")"
    }
  },
  "reference": "Starlark syntax reference\n- Function: def name(value): return value\n- Load: load(\":defs.bzl\", \"name\")\n- Rule: name = rule(implementation = _impl)\n- Provider: NameInfo = provider(fields = [\"value\"])\n- List: [1, 2, 3]; dict: {\"key\": \"value\"}\n- Condition: if value: ... elif ...: ... else: ...\n- Loop: for item in list: ...\n- BUILD files declare targets; .bzl files hold definitions"
}
