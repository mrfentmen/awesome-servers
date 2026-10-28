/**
 * SQL Formatter — keyless public API client.
 */
export class SourceError extends Error {
}
function tokenize(sql) {
    const toks = [];
    let i = 0;
    while (i < sql.length) {
        const ch = sql[i];
        if (/\s/.test(ch)) {
            i++;
            continue;
        }
        if (ch === "-" && sql[i + 1] === "-") {
            const nl = sql.indexOf("\n", i);
            const end = nl < 0 ? sql.length : nl;
            toks.push({ t: "comment", v: sql.slice(i, end), pos: i });
            i = end;
            continue;
        }
        if (ch === "/" && sql[i + 1] === "*") {
            const close = sql.indexOf("*/", i + 2);
            const end = close < 0 ? sql.length : close + 2;
            toks.push({ t: "comment", v: sql.slice(i, end), pos: i });
            i = end;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === "`") {
            let j = i + 1;
            while (j < sql.length) {
                if (sql[j] === ch) {
                    if (sql[j + 1] === ch && ch !== "`") {
                        j += 2;
                        continue;
                    }
                    j++;
                    break;
                }
                j++;
            }
            toks.push({ t: ch === "'" ? "string" : "word", v: sql.slice(i, j), pos: i });
            i = j;
            continue;
        }
        if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(sql[i + 1] ?? ""))) {
            const m = /^[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(sql.slice(i));
            const v = m ? m[0] : ch;
            toks.push({ t: "num", v, pos: i });
            i += v.length;
            continue;
        }
        if (/[A-Za-z_$]/.test(ch)) {
            const m = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(sql.slice(i));
            const v = m ? m[0] : ch;
            toks.push({ t: "word", v, pos: i });
            i += v.length;
            continue;
        }
        if ("(),;".includes(ch)) {
            toks.push({ t: "punct", v: ch, pos: i });
            i++;
            continue;
        }
        if (".+-*/%=<>!|&:".includes(ch)) {
            const m = /^(<=|>=|<>|!=|\|\||::|[.+\-*/%=<>!|&])/.exec(sql.slice(i));
            const v = m ? m[0] : ch;
            toks.push({ t: "op", v, pos: i });
            i += v.length;
            continue;
        }
        throw new SourceError(`unexpected character "${ch}" at position ${i}`);
    }
    return toks;
}
const KEYWORDS = new Set("select from where group by order having limit offset union all distinct as join left right inner outer full cross on insert into values update set delete create table index view drop alter add column primary key foreign references not null default unique check and or in like between is exists case when then else end asc desc with returning using natural cast count sum avg min max between any some".split(" "));
const JOIN_START = new Set(["join", "left", "right", "inner", "outer", "full", "cross"]);
// Keywords that read naturally with a space before a bracket; function names
// (count(, sum(, anything else) stay tight.
const SPACED_PAREN = new Set(["from", "in", "values", "exists", "on", "and", "or", "not", "where", "select", "join", "union", "distinct"]);
function phraseAt(tokens, i) {
    const word = (k) => (tokens[i + k] && tokens[i + k].t === "word" ? tokens[i + k].v.toLowerCase() : null);
    const two = [word(0), word(1)];
    const three = [word(0), word(1), word(2)];
    const phrases = [
        [["left", "outer", "join"], " "],
        [["group", "by"], " "],
        [["order", "by"], " "],
        [["left", "join"], " "],
        [["right", "join"], " "],
        [["inner", "join"], " "],
        [["full", "join"], " "],
        [["cross", "join"], " "],
        [["insert", "into"], " "],
        [["delete", "from"], " "],
        [["create", "table"], " "],
        [["alter", "table"], " "],
        [["drop", "table"], " "],
        [["union", "all"], " "],
    ];
    for (const [words] of phrases) {
        const candidate = words.length === 2 ? two : three;
        if (words.every((w, k) => candidate[k] === w))
            return words;
    }
    return null;
}
const BREAK_BEFORE = new Set(["select", "from", "where", "group by", "order by", "having", "limit", "offset", "union", "union all", "insert into", "values", "set", "update", "delete from"]);
function upper(token) {
    return token.t === "word" && KEYWORDS.has(token.v.toLowerCase()) ? token.v.toUpperCase() : token.v;
}
export async function formatSql(a) {
    const indentSize = Math.floor(a.indent ?? 2);
    if (![2, 4].includes(indentSize))
        throw new SourceError("indent must be 2 or 4");
    const upperCase = a.uppercaseKeywords !== false;
    const tokens = tokenize(a.sql);
    if (!tokens.length)
        throw new SourceError("sql is empty");
    let depth = 0;
    let inSelectList = false;
    let selectDepth = 0;
    const multilineParen = [];
    const lines = [];
    let current = "";
    const flush = () => {
        if (current.trim())
            lines.push(current.trimEnd());
        current = "";
    };
    const startNew = (extra = 0) => {
        flush();
        current = " ".repeat((depth + extra) * indentSize);
    };
    const render = upperCase ? upper : (t) => t.v;
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.t === "comment") {
            current += (current.trim() ? " " : "") + token.v;
            if (i === tokens.length - 1)
                flush();
            continue;
        }
        const phrase = phraseAt(tokens, i);
        const phraseKey = phrase ? phrase.join(" ") : token.v.toLowerCase();
        const breakKey = phrase ? phrase[0] : token.v.toLowerCase();
        const isBreak = token.t === "word" && (BREAK_BEFORE.has(phraseKey) || JOIN_START.has(breakKey));
        if (isBreak) {
            startNew();
            if (phraseKey === "select") {
                inSelectList = true;
                selectDepth = depth;
            }
            else if (depth === selectDepth && phraseKey !== "union" && phraseKey !== "union all") {
                inSelectList = false;
            }
            if (phrase) {
                current += phrase.map((w) => (upperCase ? w.toUpperCase() : w)).join(" ");
                i += phrase.length - 1;
            }
            else {
                current += render(token);
            }
            // SELECT items go one per line, indented under the keyword.
            if (phraseKey === "select")
                startNew(1);
            continue;
        }
        if (token.v === "(") {
            const next = tokens[i + 1];
            const prev = tokens[i - 1];
            const isSubquery = next && next.t === "word" && next.v.toLowerCase() === "select";
            // "FROM (" and "IN (" keep a space; function calls like count( stay tight.
            const spaced = Boolean(prev && prev.t === "word" && SPACED_PAREN.has(prev.v.toLowerCase()));
            current = current.trimEnd() + (spaced ? " (" : "(");
            depth++;
            multilineParen.push(Boolean(isSubquery));
            if (isSubquery)
                startNew();
            continue;
        }
        if (token.v === ")") {
            const wasMultiline = multilineParen.pop() ?? false;
            depth = Math.max(0, depth - 1);
            if (wasMultiline)
                startNew();
            current = current.trimEnd() + ")";
            continue;
        }
        if (token.v === ",") {
            current = current.trimEnd() + ",";
            if (inSelectList && depth === selectDepth)
                startNew(1);
            else
                current += " ";
            continue;
        }
        if (token.v === ";") {
            current = current.trimEnd() + ";";
            flush();
            continue;
        }
        if (token.t === "op") {
            // Qualified names read as one token, and * inside count( stays tight.
            const tight = token.v === "." || (token.v === "*" && /[(]$/.test(current.trimEnd()));
            current = tight ? current.trimEnd() + token.v : current.trimEnd() + ` ${token.v} `;
            continue;
        }
        const text = render(token);
        const glue = current.endsWith(".") || current.endsWith("(");
        current += current.trim() === "" || current.endsWith(" ") || glue ? text : ` ${text}`;
    }
    flush();
    const text = lines.join("\n").replace(/[ \t]+$/gm, "");
    return [`Formatted SQL (${lines.length} line(s)):`, "", text].join("\n");
}
export async function minifySql(a) {
    const strip = a.stripComments === true;
    const tokens = tokenize(a.sql).filter((t) => !(strip && t.t === "comment"));
    if (!tokens.length)
        throw new SourceError("sql is empty");
    const glued = new Set(["(", ")", ",", ";", "."]);
    let out = "";
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const prev = tokens[i - 1];
        if (!prev) {
            out = token.v;
            continue;
        }
        const needsSpace = !glued.has(token.v) && prev.v !== "(" && prev.v !== ".";
        out += needsSpace ? ` ${token.v}` : token.v;
    }
    return [`Minified SQL (${a.sql.length} -> ${out.length} character(s)):`, "", out].join("\n");
}
export async function splitStatements(a) {
    const tokens = tokenize(a.sql);
    if (!tokens.length)
        throw new SourceError("sql is empty");
    const statements = [];
    let start = tokens[0].pos;
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].v === ";") {
            const text = a.sql.slice(start, tokens[i].pos).trim();
            if (text)
                statements.push(text);
            const next = tokens[i + 1];
            start = next ? next.pos : a.sql.length;
        }
    }
    const tail = a.sql.slice(start).trim();
    if (tail)
        statements.push(tail);
    if (!statements.length)
        throw new SourceError("no statements found");
    return [
        `${statements.length} statement(s):`,
        "",
        ...statements.map((s, i) => `${i + 1}. ${s.length > 160 ? s.slice(0, 157) + "..." : s}`),
    ].join("\n");
}
