import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cadence",
  "displayName": "Cadence",
  "version": "1.0.0",
  "extensions": [
    ".cdc"
  ],
  "markers": [
    "flow.json"
  ],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "contract",
      "pattern": "^\\s*(?:access\\(all\\)\\s+)?contract\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "resource",
      "pattern": "^\\s*(?:access\\(all\\)\\s+)?resource\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*(?:access\\(all\\)\\s+)?struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:access\\(all\\)\\s+)?fun\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "event",
      "pattern": "^\\s*(?:access\\(all\\)\\s+)?event\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z0-9_]+)\\s+from\\s+([^\\s]+)"
    }
  ],
  "scaffold": [
    {
      "path": "flow.json",
      "content": "{\n  \"contracts\": {\n    \"Hello\": \"contracts/Hello.cdc\"\n  },\n  \"networks\": {\n    \"emulator\": \"127.0.0.1:3569\"\n  }\n}\n"
    },
    {
      "path": "contracts/Hello.cdc",
      "content": "access(all) contract Hello {\n    access(all) event Greeted(message: String)\n\n    access(all) fun greet(): String {\n        return \"Hello from Cadence\"\n    }\n}\n"
    }
  ],
  "snippets": {
    "contract": {
      "description": "contract",
      "body": "access(all) contract Name {\n    access(all) fun greet(): String {\n        return \"Hello\"\n    }\n}"
    },
    "resource": {
      "description": "resource",
      "body": "access(all) resource Name {\n    access(all) let value: Int\n\n    init(value: Int) {\n        self.value = value\n    }\n}"
    },
    "event": {
      "description": "event",
      "body": "access(all) event Name(value: String)"
    }
  },
  "reference": "Cadence syntax reference\n- Contract: access(all) contract Name { ... }\n- Resource: access(all) resource Name { ... }\n- Struct: access(all) struct Name { ... }\n- Function: access(all) fun name(): String { return \"value\" }\n- Event: access(all) event Name(value: String)\n- Field: access(all) let value: Int\n- Init: init(value: Int) { self.value = value }\n- Import: import Name from 0x01"
}
