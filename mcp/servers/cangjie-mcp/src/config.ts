import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cangjie",
  "displayName": "Cangjie",
  "version": "1.0.0",
  "extensions": [
    ".cj"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "package",
      "pattern": "^\\s*package\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:public\\s+|private\\s+|static\\s+)*func\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*(?:public\\s+)?(?:class|struct|interface|enum)\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "src/demo.cj",
      "content": "package demo\n\nfunc add(a: Int64, b: Int64): Int64 {\n    return a + b\n}\n"
    },
    {
      "path": "tests/run.cj",
      "content": "package run\n\nfunc value(): Int64 {\n    return 2 + 2\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "func name(value: Int64): Int64 {\n    return value + 1\n}"
    },
    "class": {
      "description": "class",
      "body": "public class Name {\n    public var value: Int64 = 1\n}"
    },
    "package": {
      "description": "package",
      "body": "package name"
    }
  },
  "reference": "Cangjie syntax reference\n- Package: package name\n- Function: func name(value: Int64): Int64 { return value + 1 }\n- Class: public class Name { public var value: Int64 = 1 }\n- Struct: public struct Name { public var value: Int64 }\n- Interface: public interface Name { func Value(): Int64 }\n- Variable: var value: Int64 = 1\n- Import: import module\n- Comment: // line; /* block */\n- Build: cjc file.cj"
}
