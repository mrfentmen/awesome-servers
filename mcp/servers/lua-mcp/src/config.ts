import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "lua",
  "displayName": "Lua",
  "version": "1.0.0",
  "extensions": [
    ".lua"
  ],
  "markers": [],
  "comment": "--",
  "blockComment": {
    "start": "--[[",
    "end": "]]"
  },
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_.:]*)"
    },
    {
      "kind": "local function",
      "pattern": "^\\s*local\\s+function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*local\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "require",
      "pattern": "^\\s*(?:local\\s+\\w+\\s*=\\s*)?require\\s*\\(?[\"']([^\"']+)"
    }
  ],
  "runner": [
    {
      "command": "lua",
      "args": [
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "lua",
      "args": [
        "tests/run.lua"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.lua",
      "content": "local Demo = {}\n\nfunction Demo.greet()\n    print(\"Hello from Lua\")\nend\n\nreturn Demo\n"
    },
    {
      "path": "tests/run.lua",
      "content": "if 2 + 2 ~= 4 then error(\"math failed\") end\nprint(\"ok\")\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function name(value)\n    return value\nend"
    },
    "local_function": {
      "description": "local function",
      "body": "local function name(value)\n    return value\nend"
    },
    "table": {
      "description": "table",
      "body": "local name = { value = 1 }"
    }
  },
  "reference": "Lua syntax reference\n- Function: function name(args) ... end\n- Local function: local function name(args) ... end\n- Variables: local name = value\n- Tables: local value = { key = 1 }\n- Conditionals: if test then ... elseif ... else ... end\n- Loops: for i = 1, 10 do ... end; for key, value in pairs(t) do ... end\n- Module: local Name = {}; function Name.run() ... end; return Name\n- Require: local name = require(\"name\")\n- Comment: -- line; --[[ block ]]\n- Run: lua file.lua"
}
