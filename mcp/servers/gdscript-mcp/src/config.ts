import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gdscript",
  "displayName": "GDScript",
  "version": "1.0.0",
  "extensions": [
    ".gd"
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
      "pattern": "^\\s*func\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class_name\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "signal",
      "pattern": "^\\s*signal\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*(?:var|const)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "preload",
      "pattern": "preload\\s*\\(\\s*[\"']([^\"']+)"
    },
    {
      "kind": "load",
      "pattern": "load\\s*\\(\\s*[\"']([^\"']+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.gd",
      "content": "extends Node\n\nfunc add(a, b):\n    return a + b\n\nfunc _ready():\n    print(add(2, 2))\n"
    },
    {
      "path": "tests/run.gd",
      "content": "extends SceneTree\n\nfunc _init():\n    if 2 + 2 != 4:\n        push_error('math failed')\n    quit()\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "func name(value):\n    return value + 1"
    },
    "class": {
      "description": "class",
      "body": "class_name Name\nextends Node"
    },
    "signal": {
      "description": "signal",
      "body": "signal changed(value)"
    }
  },
  "reference": "GDScript syntax reference\n- Function: func name(value): return value + 1\n- Class: class_name Name\n- Extends: extends Node\n- Variable: var name = 1\n- Constant: const NAME = 1\n- Signal: signal changed(value)\n- Conditional: if condition: ... elif ... else:\n- Loop: for item in items: ...\n- Comment: # line\n- Run: godot --headless --script file.gd"
}
