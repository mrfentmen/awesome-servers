import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "apex",
  "displayName": "Apex",
  "version": "1.0.0",
  "extensions": [
    ".cls",
    ".apex",
    ".trigger"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "'"
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^\\s*(?:public|global|private)?\\s*(?:with\\s+sharing\\s+)?class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "trigger",
      "pattern": "^\\s*trigger\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "method",
      "pattern": "^\\s*(?:public|private|protected|global)\\s+(?:static\\s+)?[A-Za-z_][A-Za-z0-9_<>\\[\\]]*\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z0-9_.]+)"
    }
  ],
  "scaffold": [
    {
      "path": "force-app/main/default/classes/Demo.cls",
      "content": "public with sharing class Demo {\n  public static Integer add(Integer a, Integer b) {\n    return a + b;\n  }\n}\n"
    },
    {
      "path": "force-app/main/default/triggers/DemoTrigger.trigger",
      "content": "trigger DemoTrigger on Account (before insert) {\n  for (Account account : Trigger.new) {\n    account.Name = account.Name;\n  }\n}\n"
    }
  ],
  "snippets": {
    "class": {
      "description": "class",
      "body": "public with sharing class Name {\n  public static Integer add(Integer a, Integer b) {\n    return a + b;\n  }\n}"
    },
    "trigger": {
      "description": "trigger",
      "body": "trigger Name on Account (before insert) {\n  for (Account item : Trigger.new) {\n    item.Name = item.Name;\n  }\n}"
    },
    "soql": {
      "description": "SOQL query",
      "body": "List<Account> rows = [SELECT Id, Name FROM Account LIMIT 10];"
    }
  },
  "reference": "Apex syntax reference\n- Class: public with sharing class Name { ... }\n- Method: public static Integer add(Integer a, Integer b) { ... }\n- Trigger: trigger Name on Account (before insert) { ... }\n- SOQL: [SELECT Id, Name FROM Account LIMIT 10]\n- DML: insert record; update record;\n- Property: public String name { get; set; }\n- Import: import namespace.Name;\n- Comment: // line; /* block */"
}
