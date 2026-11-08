import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "wdl",
  "displayName": "WDL",
  "version": "1.0.0",
  "extensions": [
    ".wdl"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "workflow",
      "pattern": "^\\s*workflow\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "task",
      "pattern": "^\\s*task\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "call",
      "pattern": "^\\s*call\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.wdl",
      "content": "version 1.0\n\ntask Add {\n  command {\n    echo $((2 + 2))\n  }\n  output {\n    Int result = read_int(stdout())\n  }\n}\n\nworkflow Demo {\n  call Add { input: }\n}\n"
    },
    {
      "path": "tests/run.wdl",
      "content": "version 1.0\n\nworkflow Test {\n  Int value = 2 + 2\n}\n"
    }
  ],
  "snippets": {
    "task": {
      "description": "task",
      "body": "task Name {\n  command {\n    echo hello\n  }\n}"
    },
    "workflow": {
      "description": "workflow",
      "body": "workflow Name {\n}"
    },
    "struct": {
      "description": "struct",
      "body": "struct Name {\n  String value\n}"
    }
  },
  "reference": "WDL syntax reference\n- Version: version 1.0\n- Task: task Name { command { ... } output { ... } }\n- Workflow: workflow Name { call Task }\n- Struct: struct Name { String value }\n- Call: call Task { input: }\n- Variable: Int value = 1\n- Import: import \"file.wdl\"\n- Comment: # line\n- Run: miniwdl run file.wdl"
}
