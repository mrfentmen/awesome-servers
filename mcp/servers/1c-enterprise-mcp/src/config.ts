import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "1c-enterprise",
  "displayName": "1C Enterprise",
  "version": "1.0.0",
  "extensions": [
    ".bsl",
    ".os"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "procedure",
      "pattern": "^\\s*(?:Процедура|Procedure)\\s+([А-Яа-яA-Za-z_][А-Яа-яA-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:Функция|Function)\\s+([А-Яа-яA-Za-z_][А-Яа-яA-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*(?:Перем|Var)\\s+([А-Яа-яA-Za-z_][А-Яа-яA-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*#(?:Использовать|Use)\\s+\"?([^\"\\s]+)"
    },
    {
      "kind": "include",
      "pattern": "^\\s*#(?:Включить|Include)\\s+\"?([^\"\\s]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/hello.bsl",
      "content": "Процедура Привет()\n  Сообщить(\"Привет\");\nКонецПроцедуры\n"
    },
    {
      "path": "tests/run.bsl",
      "content": "Если 2 + 2 = 4 Тогда\n  Сообщить(\"ok\");\nКонецЕсли\n"
    }
  ],
  "snippets": {
    "procedure": {
      "description": "procedure",
      "body": "Процедура Имя()\n  Сообщить(\"Привет\");\nКонецПроцедуры"
    },
    "function": {
      "description": "function",
      "body": "Функция Имя(Значение)\n  Возврат Значение + 1;\nКонецФункции"
    },
    "variable": {
      "description": "variable",
      "body": "Перем Значение;"
    }
  },
  "reference": "1C Enterprise syntax reference\n- Procedure: Процедура Имя() ... КонецПроцедуры\n- Function: Функция Имя(Значение) ... КонецФункции\n- Variable: Перем Значение;\n- Condition: Если ... Тогда ... КонецЕсли;\n- Loop: Для ... По ... Цикл ... КонецЦикла;\n- Return: Возврат Значение;\n- Include: #Включить \"file.bsl\"\n- Comment: // line"
}
