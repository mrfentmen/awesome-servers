import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "kotlin",
  "displayName": "Kotlin",
  "version": "1.0.0",
  "extensions": [
    ".kt",
    ".kts"
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
      "kind": "function",
      "pattern": "^\\s*fun\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*(?:data\\s+|sealed\\s+|abstract\\s+)?class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "object",
      "pattern": "^\\s*object\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "interface",
      "pattern": "^\\s*interface\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.*]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/Main.kt",
      "content": "fun greet() {\n    println(\"Hello from Kotlin\")\n}\n\nfun main() {\n    greet()\n}\n"
    },
    {
      "path": "tests/Run.kt",
      "content": "fun main() {\n    check(2 + 2 == 4)\n    println(\"ok\")\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fun name(value: Int): Int {\n    return value + 1\n}"
    },
    "class": {
      "description": "data class",
      "body": "data class Name(val value: Int)"
    },
    "object": {
      "description": "object",
      "body": "object Name {\n    fun run() = Unit\n}"
    }
  },
  "reference": "Kotlin syntax reference\n- Function: fun name(value: Int): Int { return value + 1 }\n- Variable: val name = value; var name = value\n- Class: class Name(val value: Int)\n- Data class: data class Name(val value: Int)\n- Object: object Name { fun run() = Unit }\n- Interface: interface Name { fun run() }\n- Null safety: value?.property ?: fallback\n- Import: import package.Name\n- Comment: // line; /* block */\n- Run: kotlinc -script file.kts"
}
