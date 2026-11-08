import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "groovy",
  "displayName": "Groovy",
  "version": "1.0.0",
  "extensions": [
    ".groovy",
    ".gradle"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "interface",
      "pattern": "^\\s*interface\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "trait",
      "pattern": "^\\s*trait\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "method",
      "pattern": "^\\s*(?:static\\s+)?(?:void|def|[A-Z][A-Za-z0-9_<>]*)\\s+([a-z_][A-Za-z0-9_]*)\\s*\\("
    },
    {
      "kind": "variable",
      "pattern": "^\\s*def\\s+([a-z_][A-Za-z0-9_]*)\\s*="
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
      "path": "src/Demo.groovy",
      "content": "class Demo {\n    static void greet() {\n        println \"Hello from Groovy\"\n    }\n\n    static void main(String[] args) {\n        greet()\n    }\n}\n"
    },
    {
      "path": "tests/run.groovy",
      "content": "assert 2 + 2 == 4\nprintln \"ok\"\n"
    }
  ],
  "snippets": {
    "class": {
      "description": "class",
      "body": "class Name {\n    static void run() {}\n}"
    },
    "method": {
      "description": "method",
      "body": "static void name() {\n    println \"Hello\"\n}"
    },
    "closure": {
      "description": "closure",
      "body": "def name = { value -> value + 1 }"
    }
  },
  "reference": "Groovy syntax reference\n- Class: class Name { static void run() {} }\n- Interface: interface Name { void run() }\n- Trait: trait Name { void run() {} }\n- Method: static void name() { println \"Hello\" }\n- Variable: def name = value\n- Closure: def name = { value -> value + 1 }\n- GString: \"value ${name}\"\n- Import: import groovy.json.JsonSlurper\n- Comment: // line; /* block */\n- Run: groovy file.groovy"
}
