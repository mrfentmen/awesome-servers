import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "xmake",
  "displayName": "Xmake",
  "version": "1.0.0",
  "extensions": [
    ".lua"
  ],
  "markers": [
    "xmake.lua"
  ],
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
      "kind": "target",
      "pattern": "^\\s*target\\s*\\(\\s*[\"']([^\"']+)"
    },
    {
      "kind": "option",
      "pattern": "^\\s*option\\s*\\(\\s*[\"']([^\"']+)"
    },
    {
      "kind": "task",
      "pattern": "^\\s*task\\s*\\(\\s*[\"']([^\"']+)"
    },
    {
      "kind": "rule",
      "pattern": "^\\s*rule\\s*\\(\\s*[\"']([^\"']+)"
    }
  ],
  "imports": [
    {
      "kind": "includes",
      "pattern": "^\\s*includes\\s*\\(\\s*[\"']([^\"']+)"
    },
    {
      "kind": "requires",
      "pattern": "^\\s*add_requires\\s*\\(\\s*[\"']([^\"']+)"
    }
  ],
  "build": [
    {
      "command": "xmake",
      "args": []
    }
  ],
  "test": [
    {
      "command": "xmake",
      "args": [
        "test"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "xmake.lua",
      "content": "target(\"{{name}}\")\n    set_kind(\"binary\")\n    add_files(\"src/main.c\")\n"
    },
    {
      "path": "src/main.c",
      "content": "#include <stdio.h>\nint main(void) {\n  puts(\"Hello from Xmake\");\n  return 0;\n}\n"
    },
    {
      "path": "tests/xmake.lua",
      "content": "target(\"smoke\")\n    set_kind(\"phony\")\n    on_run(function () print(\"ok\") end)\n"
    }
  ],
  "snippets": {
    "target": {
      "description": "target",
      "body": "target(\"name\")\n    set_kind(\"binary\")\n    add_files(\"src/main.c\")"
    },
    "option": {
      "description": "option",
      "body": "option(\"name\")\n    set_default(false)"
    },
    "rule": {
      "description": "rule",
      "body": "rule(\"name\")\n    on_build(function (target) end)"
    }
  },
  "reference": "Xmake syntax reference\n- Target: target(\"name\")\n- Kind: set_kind(\"binary\")\n- Files: add_files(\"src/main.c\")\n- Option: option(\"name\")\n- Rule: rule(\"name\")\n- Requires: add_requires(\"zlib\")\n- Includes: includes(\"path\")\n- Build: xmake; test: xmake test"
}
