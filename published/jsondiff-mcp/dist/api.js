/**
 * JSON Diff & Patch — keyless public API client.
 */
export class SourceError extends Error {
}
const MAX_CHANGES = 400;
function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
function equalValues(a, b) {
    if (a === b)
        return true;
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length)
            return false;
        return a.every((v, i) => equalValues(v, b[i]));
    }
    if (isPlainObject(a) && isPlainObject(b)) {
        const keysA = Object.keys(a).sort();
        const keysB = Object.keys(b).sort();
        if (keysA.length !== keysB.length || keysA.some((k, i) => k !== keysB[i]))
            return false;
        return keysA.every((k) => equalValues(a[k], b[k]));
    }
    return false;
}
function walk(left, right, path, out, depth) {
    if (out.length >= MAX_CHANGES)
        return;
    if (depth > 40)
        throw new SourceError("comparison is limited to 40 levels of nesting");
    if (Array.isArray(left) && Array.isArray(right)) {
        const max = Math.max(left.length, right.length);
        for (let i = 0; i < max && out.length < MAX_CHANGES; i++) {
            const p = `${path}[${i}]`;
            if (i >= right.length)
                out.push({ kind: "-", path: p, left: left[i] });
            else if (i >= left.length)
                out.push({ kind: "+", path: p, right: right[i] });
            else
                walk(left[i], right[i], p, out, depth + 1);
        }
        return;
    }
    if (isPlainObject(left) && isPlainObject(right)) {
        const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort();
        for (const key of keys) {
            if (out.length >= MAX_CHANGES)
                return;
            const p = path ? `${path}.${key}` : key;
            if (!(key in left))
                out.push({ kind: "+", path: p, right: right[key] });
            else if (!(key in right))
                out.push({ kind: "-", path: p, left: left[key] });
            else
                walk(left[key], right[key], p, out, depth + 1);
        }
        return;
    }
    if (!equalValues(left, right))
        out.push({ kind: "~", path: path || "(root)", left, right });
}
function show(value) {
    const text = JSON.stringify(value);
    if (text === undefined)
        return "undefined";
    return text.length > 80 ? text.slice(0, 77) + "..." : text;
}
function parseSide(label, text) {
    try {
        return JSON.parse(text);
    }
    catch (e) {
        throw new SourceError(`${label} is not valid JSON: ${e.message}`);
    }
}
export async function diffJson(a) {
    const left = parseSide("left", a.left);
    const right = parseSide("right", a.right);
    const changes = [];
    walk(left, right, "", changes, 0);
    if (!changes.length)
        return "The two documents are identical.";
    const added = changes.filter((c) => c.kind === "+").length;
    const removed = changes.filter((c) => c.kind === "-").length;
    const changed = changes.filter((c) => c.kind === "~").length;
    return [
        `${changes.length} change(s): ${added} added, ${removed} removed, ${changed} changed${changes.length >= MAX_CHANGES ? " (capped)" : ""}`,
        "",
        ...changes.map((c) => c.kind === "+" ? `+ ${c.path} = ${show(c.right)}` :
            c.kind === "-" ? `- ${c.path} = ${show(c.left)}` :
                `~ ${c.path}: ${show(c.left)} -> ${show(c.right)}`),
    ].join("\n");
}
function pointerTokens(pointer) {
    if (pointer === "")
        return [];
    if (!pointer.startsWith("/"))
        throw new SourceError(`JSON pointer must start with "/": "${pointer}"`);
    return pointer.slice(1).split("/").map((token) => token.replace(/~1/g, "/").replace(/~0/g, "~"));
}
function navigate(doc, pointer) {
    const tokens = pointerTokens(pointer);
    if (!tokens.length)
        throw new SourceError("JSON pointer must point inside the document (an empty pointer is the root)");
    let parent = doc;
    for (const token of tokens.slice(0, -1)) {
        if (Array.isArray(parent)) {
            const index = Number(token);
            if (!Number.isInteger(index) || index < 0 || index >= parent.length)
                throw new SourceError(`path not found: ${pointer}`);
            parent = parent[index];
        }
        else if (isPlainObject(parent)) {
            if (!(token in parent))
                throw new SourceError(`path not found: ${pointer}`);
            parent = parent[token];
        }
        else {
            throw new SourceError(`path not found: ${pointer}`);
        }
    }
    return { parent, key: tokens[tokens.length - 1], value: parent ? parent[tokens[tokens.length - 1]] : undefined };
}
function applyOperation(doc, op, index) {
    if (!isPlainObject(op) || typeof op.op !== "string")
        throw new SourceError(`operation ${index + 1} needs an "op"`);
    const kind = op.op;
    if (!["add", "remove", "replace", "move", "copy", "test"].includes(kind)) {
        throw new SourceError(`operation ${index + 1} has unknown op "${kind}"`);
    }
    const insert = (pointer, value) => {
        const tokens = pointerTokens(pointer);
        if (!tokens.length)
            throw new SourceError("cannot replace the whole document from an operation");
        const { parent, key } = navigate(doc, pointer);
        if (Array.isArray(parent)) {
            if (key === "-") {
                parent.push(value);
                return;
            }
            const at = Number(key);
            if (!Number.isInteger(at) || at < 0 || at > parent.length)
                throw new SourceError(`operation ${index + 1}: bad array index ${key}`);
            parent.splice(at, 0, value);
            return;
        }
        if (!isPlainObject(parent))
            throw new SourceError(`operation ${index + 1}: ${pointer} does not point into an object or array`);
        parent[key] = value;
    };
    const remove = (pointer) => {
        const { parent, key, value } = navigate(doc, pointer);
        if (Array.isArray(parent)) {
            const at = Number(key);
            if (!Number.isInteger(at) || at < 0 || at >= parent.length)
                throw new SourceError(`operation ${index + 1}: bad array index ${key}`);
            return parent.splice(at, 1)[0];
        }
        if (!isPlainObject(parent) || !(key in parent))
            throw new SourceError(`operation ${index + 1}: ${pointer} does not exist`);
        const old = parent[key];
        delete parent[key];
        return old;
    };
    switch (kind) {
        case "add":
            insert(op.path, op.value);
            break;
        case "remove":
            remove(op.path);
            break;
        case "replace": {
            const { parent, key, value } = navigate(doc, op.path);
            void value;
            if (Array.isArray(parent)) {
                const at = Number(key);
                if (!Number.isInteger(at) || at < 0 || at >= parent.length)
                    throw new SourceError(`operation ${index + 1}: bad array index ${key}`);
                parent[at] = op.value;
            }
            else {
                if (!isPlainObject(parent) || !(key in parent))
                    throw new SourceError(`operation ${index + 1}: ${op.path} does not exist`);
                parent[key] = op.value;
            }
            break;
        }
        case "move": {
            if (op.from === undefined)
                throw new SourceError(`operation ${index + 1}: move needs "from"`);
            const value = remove(op.from);
            insert(op.path, value);
            break;
        }
        case "copy": {
            if (op.from === undefined)
                throw new SourceError(`operation ${index + 1}: copy needs "from"`);
            const { value } = navigate(doc, op.from);
            insert(op.path, JSON.parse(JSON.stringify(value ?? null)));
            break;
        }
        case "test": {
            const { value } = navigate(doc, op.path);
            if (!equalValues(value, op.value)) {
                throw new SourceError(`operation ${index + 1}: test failed at ${op.path} — found ${show(value)}, expected ${show(op.value)}`);
            }
            break;
        }
    }
    return doc;
}
export async function applyJsonPatch(a) {
    const doc = parseSide("target", a.target);
    let ops;
    try {
        ops = JSON.parse(a.patch);
    }
    catch (e) {
        throw new SourceError(`patch is not valid JSON: ${e.message}`);
    }
    if (!Array.isArray(ops))
        throw new SourceError("patch must be a JSON array of operations (RFC 6902)");
    ops.forEach((op, i) => applyOperation(doc, op, i));
    return [
        `Applied ${ops.length} operation(s).`,
        "",
        JSON.stringify(doc, null, 2),
    ].join("\n");
}
function sortedClone(value) {
    if (Array.isArray(value))
        return value.map(sortedClone);
    if (isPlainObject(value)) {
        const out = {};
        for (const key of Object.keys(value).sort())
            out[key] = sortedClone(value[key]);
        return out;
    }
    return value;
}
export async function canonicalJson(a) {
    const value = parseSide("text", a.text);
    const indent = Math.floor(a.indent ?? 2);
    if (!Number.isInteger(indent) || indent < 0 || indent > 8)
        throw new SourceError("indent must be between 0 and 8");
    const shaped = a.sortKeys === false ? value : sortedClone(value);
    const text = JSON.stringify(shaped, null, indent || undefined);
    return [
        a.sortKeys === false ? "Re-serialised (key order preserved):" : "Canonical form (keys sorted):",
        "",
        text,
    ].join("\n");
}
