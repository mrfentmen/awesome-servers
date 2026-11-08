import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "php",
  "displayName": "PHP",
  "version": "1.0.0",
  "extensions": [
    ".php"
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
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "interface",
      "pattern": "^\\s*interface\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "trait",
      "pattern": "^\\s*trait\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "namespace",
      "pattern": "^\\s*namespace\\s+([A-Za-z_][A-Za-z0-9_\\\\]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Za-z_][A-Za-z0-9_\\\\]*)"
    },
    {
      "kind": "require",
      "pattern": "^\\s*(?:require|include)(?:_once)?\\s*\\(?\\s*[\"']([^\"']+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/Demo.php",
      "content": "<?php\n\nfunction greet(): void\n{\n    echo \"Hello from PHP\\n\";\n}\n\ngreet();\n"
    },
    {
      "path": "tests/run.php",
      "content": "<?php\n\nif (2 + 2 !== 4) {\n    fwrite(STDERR, \"math failed\\n\");\n    exit(1);\n}\necho \"ok\\n\";\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function name(int $value): int\n{\n    return $value + 1;\n}"
    },
    "class": {
      "description": "class",
      "body": "class Name\n{\n    public function run(): void\n    {\n    }\n}"
    },
    "namespace": {
      "description": "namespace",
      "body": "namespace App;\n\nuse App\\Name;"
    }
  },
  "reference": "PHP syntax reference\n- Open tag: <?php\n- Function: function name(int $value): int { return $value; }\n- Variable: $name = value;\n- Class: class Name { public function run(): void {} }\n- Interface: interface Name { public function run(): void; }\n- Trait: trait Name { ... }\n- Namespace: namespace App;\n- Import: use App\\Name;\n- Comment: // line; /* block */\n- Run: php file.php"
}
