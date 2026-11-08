import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "scala",
  "displayName": "Scala",
  "version": "1.0.0",
  "extensions": [
    ".scala",
    ".sc"
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
      "kind": "object",
      "pattern": "^\\s*object\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "trait",
      "pattern": "^\\s*trait\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*def\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "enum",
      "pattern": "^\\s*enum\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.{]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/Demo.scala",
      "content": "object Demo {\n  def greet(): Unit = println(\"Hello from Scala\")\n\n  def main(args: Array[String]): Unit = greet()\n}\n"
    },
    {
      "path": "tests/Run.scala",
      "content": "object Run {\n  def main(args: Array[String]): Unit = {\n    assert(2 + 2 == 4)\n    println(\"ok\")\n  }\n}\n"
    }
  ],
  "snippets": {
    "object": {
      "description": "object",
      "body": "object Name {\n  def run(): Unit = ()\n}"
    },
    "class": {
      "description": "class",
      "body": "class Name(val value: Int)"
    },
    "trait": {
      "description": "trait",
      "body": "trait Name {\n  def run(): Unit\n}"
    }
  },
  "reference": "Scala syntax reference\n- Object: object Name { def run(): Unit = () }\n- Class: class Name(val value: Int)\n- Case class: case class Name(value: Int)\n- Trait: trait Name { def run(): Unit }\n- Function: def name(value: Int): Int = value + 1\n- Enum: enum Name { case One, Two }\n- Pattern matching: value match { case 1 => ...; case _ => ... }\n- Import: import scala.collection.mutable\n- Comment: // line; /* block */\n- Run: scala file.scala"
}
