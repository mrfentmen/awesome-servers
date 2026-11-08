import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "al",
  "displayName": "AL",
  "version": "1.0.0",
  "extensions": [
    ".al"
  ],
  "markers": [
    "app.json"
  ],
  "comment": "//",
  "stringQuotes": [
    "'"
  ],
  "symbols": [
    {
      "kind": "table",
      "pattern": "^\\s*table\\s+\\d+\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "page",
      "pattern": "^\\s*page\\s+\\d+\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "codeunit",
      "pattern": "^\\s*codeunit\\s+\\d+\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "procedure",
      "pattern": "^\\s*procedure\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "trigger",
      "pattern": "^\\s*trigger\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "using",
      "pattern": "^\\s*using\\s+([A-Za-z0-9_.]+)"
    }
  ],
  "scaffold": [
    {
      "path": "app.json",
      "content": "{\n  \"id\": \"00000000-0000-0000-0000-000000000000\",\n  \"name\": \"{{name}}\",\n  \"publisher\": \"Bond\",\n  \"version\": \"1.0.0.0\",\n  \"dependencies\": [],\n  \"platform\": \"1.0.0.0\",\n  \"application\": \"1.0.0.0\"\n}\n"
    },
    {
      "path": "src/Hello.al",
      "content": "table 50100 Hello\n{\n  fields\n  {\n    field(1; Name; Text[100]) { }\n  }\n}\n"
    }
  ],
  "snippets": {
    "table": {
      "description": "table",
      "body": "table 50100 Name\n{\n  fields\n  {\n    field(1; Name; Text[100]) { }\n  }\n}"
    },
    "page": {
      "description": "page",
      "body": "page 50100 Name\n{\n  PageType = Card;\n  SourceTable = Name;\n}"
    },
    "procedure": {
      "description": "procedure",
      "body": "procedure Name(Value: Integer): Integer\nbegin\n  exit(Value + 1);\nend;"
    }
  },
  "reference": "AL syntax reference\n- Table: table 50100 Name { fields { field(1; Name; Text[100]) { } } }\n- Page: page 50100 Name { PageType = Card; SourceTable = Name; }\n- Codeunit: codeunit 50100 Name { ... }\n- Procedure: procedure Name(Value: Integer): Integer begin ... end;\n- Trigger: trigger OnInsert() begin ... end;\n- Field: field(1; Name; Text[100]) { }\n- Using: using System.Text;\n- Comment: // line"
}
