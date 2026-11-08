import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "vim-script",
  "displayName": "Vim script",
  "version": "1.0.0",
  "extensions": [
    ".vim",
    ".vimrc"
  ],
  "markers": [],
  "comment": "\"",
  "stringQuotes": [],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*fu(?:nction)?!?\\s+([A-Za-z0-9_:#.]+)"
    },
    {
      "kind": "command",
      "pattern": "^\\s*com(?:mand)?!?\\s+([A-Za-z0-9_]+)"
    },
    {
      "kind": "augroup",
      "pattern": "^\\s*augroup\\s+([A-Za-z0-9_]+)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*let\\s+(g:[A-Za-z0-9_]+)"
    }
  ],
  "imports": [
    {
      "kind": "source",
      "pattern": "^\\s*source\\s+(.+)$"
    },
    {
      "kind": "runtime",
      "pattern": "^\\s*runtime\\s+(.+)$"
    },
    {
      "kind": "packadd",
      "pattern": "^\\s*packadd\\s+(.+)$"
    }
  ],
  "runner": [
    {
      "command": "vim",
      "args": [
        "-Nu",
        "NONE",
        "-n",
        "-es",
        "-S",
        "{file}",
        "-c",
        "qa"
      ]
    }
  ],
  "test": [
    {
      "command": "vim",
      "args": [
        "-Nu",
        "NONE",
        "-n",
        "-es",
        "-S",
        "tests/run.vim",
        "-c",
        "qa"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "plugin/example.vim",
      "content": "function! Greet(name) abort\n  echom \"Hello, \" . a:name\nendfunction\n"
    },
    {
      "path": "tests/run.vim",
      "content": "function! TestAdd() abort\n  if 2 + 2 != 4\n    throw \"math failed\"\n  endif\nendfunction\n\ncall TestAdd()\nqa!\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function! Name(args) abort\n  \" body\nendfunction"
    },
    "command": {
      "description": "user command",
      "body": "command! -nargs=0 Name call Name()"
    },
    "augroup": {
      "description": "autocommand group",
      "body": "augroup Name\n  autocmd!\n  autocmd BufWritePost * call Name()\naugroup END"
    }
  },
  "reference": "Vim script syntax reference\n- Functions: function! Name(args) abort ... endfunction\n- Call: call Name(args)\n- Variables: let g:name = value; echo g:name\n- Commands: command! -nargs=0 Name call Name()\n- Autocommands: augroup Name ... augroup END\n- Mappings: nnoremap <leader>x :call Name()<CR>\n- Conditionals: if condition ... elseif ... endif\n- Loops: for item in list ... endfor; while condition ... endwhile\n- Source: source file.vim\n- Run headless: vim -Nu NONE -n -es -S file.vim -c qa"
}
