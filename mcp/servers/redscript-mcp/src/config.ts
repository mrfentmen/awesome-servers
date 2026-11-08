import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "redscript",
  "displayName": "Redscript",
  "version": "1.0.0",
  "extensions": [
    ".reds"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*(?:public\\s+)?(?:class|enum)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:public\\s+)?func\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.reds",
      "content": "module Demo\n\npublic class Adder extends IScriptable {\n  public func Add(a: Int32, b: Int32) -> Int32 {\n    return a + b;\n  }\n}\n"
    },
    {
      "path": "tests/run.reds",
      "content": "module Demo\n\npublic class Adder extends IScriptable {\n  public func Add(a: Int32, b: Int32) -> Int32 {\n    return a + b;\n  }\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "module Name\n\npublic class Value extends IScriptable {\n  public func Get() -> Int32 {\n    return 1;\n  }\n}"
    }
  },
  "reference": "Redscript syntax reference\n- Module: module Name\n- Class: public class Name extends IScriptable { ... }\n- Function: public func Name(value: Int32) -> Int32 { return value; }\n- Import: import Codeware.UI\n- Variable: let value: Int32 = 1;\n- Comment: // line; /* block */\n- Run: redscript-cli file.reds",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
