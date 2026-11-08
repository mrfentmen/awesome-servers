import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "tact",
  "displayName": "Tact",
  "version": "1.0.0",
  "extensions": [
    ".tact"
  ],
  "markers": [
    "tact.config.json"
  ],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "contract",
      "pattern": "^\\s*contract\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "message",
      "pattern": "^\\s*message(?:\\([^)]*\\))?\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:get\\s+)?fun\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+\"([^\"]+)\""
    }
  ],
  "build": [
    {
      "command": "tact",
      "args": [
        "--config",
        "tact.config.json"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "tact.config.json",
      "content": "{\n  \"projects\": [\n    {\n      \"name\": \"hello\",\n      \"path\": \"./contracts/Hello.tact\",\n      \"output\": \"./build\"\n    }\n  ]\n}\n"
    },
    {
      "path": "contracts/Hello.tact",
      "content": "contract Hello {\n    init() {}\n\n    get fun greeting(): String {\n        return \"Hello from Tact\";\n    }\n}\n"
    }
  ],
  "snippets": {
    "contract": {
      "description": "contract",
      "body": "contract Name {\n    init() {}\n\n    get fun greeting(): String {\n        return \"Hello\";\n    }\n}"
    },
    "message": {
      "description": "message",
      "body": "message Name {\n    value: Int as uint32;\n}"
    },
    "function": {
      "description": "function",
      "body": "fun name(value: Int): Int {\n    return value + 1;\n}"
    }
  },
  "reference": "Tact syntax reference\n- Contract: contract Name { ... }\n- Init: init() { ... }\n- Getter: get fun name(): String { return \"value\"; }\n- Function: fun name(value: Int): Int { return value; }\n- Message: message Name { value: Int as uint32; }\n- Struct: struct Name { value: Int; }\n- Import: import \"file.tact\";\n- Build: tact --config tact.config.json"
}
