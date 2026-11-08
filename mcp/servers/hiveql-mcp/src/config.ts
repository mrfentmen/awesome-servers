import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "hiveql",
  "displayName": "HiveQL",
  "version": "1.0.0",
  "extensions": [
    ".q",
    ".hql"
  ],
  "markers": [],
  "comment": "--",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "'",
    "\""
  ],
  "symbols": [
    {
      "kind": "table",
      "pattern": "^\\s*CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "view",
      "pattern": "^\\s*CREATE\\s+VIEW\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*CREATE\\s+FUNCTION\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "insert",
      "pattern": "^\\s*INSERT\\s+OVERWRITE\\s+TABLE\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "imports": [
    {
      "kind": "jar",
      "pattern": "^\\s*ADD\\s+JAR\\s+['\"]?([^'\";]+)"
    }
  ],
  "runner": [
    {
      "command": "hive",
      "args": [
        "-f",
        "{file}"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "schema.hql",
      "content": "CREATE TABLE IF NOT EXISTS demo (id INT, name STRING);\nINSERT OVERWRITE TABLE demo VALUES (1, 'Bond');\nSELECT * FROM demo;\n"
    },
    {
      "path": "tests/run.hql",
      "content": "SELECT 2 + 2;\n"
    }
  ],
  "snippets": {
    "table": {
      "description": "table",
      "body": "CREATE TABLE IF NOT EXISTS name (id INT, value STRING);"
    },
    "insert": {
      "description": "insert overwrite",
      "body": "INSERT OVERWRITE TABLE name VALUES (1, 'value');"
    },
    "select": {
      "description": "select",
      "body": "SELECT * FROM name WHERE id = 1;"
    }
  },
  "reference": "HiveQL syntax reference\n- Table: CREATE TABLE IF NOT EXISTS name (id INT, value STRING);\n- Partition: PARTITIONED BY (day STRING)\n- Insert: INSERT OVERWRITE TABLE name VALUES (1, 'x');\n- Select: SELECT * FROM name WHERE id = 1;\n- Join: SELECT * FROM a JOIN b ON a.id = b.id;\n- View: CREATE VIEW name AS SELECT ...;\n- Jar: ADD JAR 'file.jar';\n- Comment: -- line; /* block */\n- Run: hive -f file.hql"
}
