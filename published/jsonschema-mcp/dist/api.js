/**
 * JSON Schema Validator — keyless public API client.
 */
export class SourceError extends Error {
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
function parseJson(label, text) {
    try {
        return JSON.parse(text);
    }
    catch (e) {
        throw new SourceError(`${label} is not valid JSON: ${e.message}`);
    }
}
function typeOf(value) {
    if (value === null)
        return "null";
    if (Array.isArray(value))
        return "array";
    return typeof value;
}
function typeMatches(value, want) {
    const actual = typeOf(value);
    if (want === "integer")
        return actual === "number" && Number.isInteger(value);
    if (want === "number")
        return actual === "number";
    return actual === want;
}
function pointer(path) {
    return path || "$";
}
function validateValue(value, schema, path, errors, maxErrors) {
    if (errors.length >= maxErrors)
        return;
    if (schema === true || schema === undefined || schema === null)
        return;
    if (schema === false) {
        errors.push(`${pointer(path)}: schema is false - no value is allowed here`);
        return;
    }
    if (typeof schema !== "object") {
        errors.push(`${pointer(path)}: schema must be an object or boolean`);
        return;
    }
    if (schema.const !== undefined && JSON.stringify(value) !== JSON.stringify(schema.const)) {
        errors.push(`${pointer(path)}: expected const ${JSON.stringify(schema.const)}, got ${JSON.stringify(value)}`);
    }
    if (Array.isArray(schema.enum) && !schema.enum.some((v) => JSON.stringify(v) === JSON.stringify(value))) {
        errors.push(`${pointer(path)}: ${JSON.stringify(value)} is not one of ${JSON.stringify(schema.enum)}`);
    }
    if (schema.type !== undefined) {
        const wants = Array.isArray(schema.type) ? schema.type : [schema.type];
        if (!wants.some((t) => typeMatches(value, t))) {
            errors.push(`${pointer(path)}: expected ${wants.join(" or ")}, got ${typeOf(value)}`);
            return;
        }
    }
    if (typeof value === "number") {
        if (typeof schema.minimum === "number" && value < schema.minimum)
            errors.push(`${pointer(path)}: ${value} is less than minimum ${schema.minimum}`);
        if (typeof schema.maximum === "number" && value > schema.maximum)
            errors.push(`${pointer(path)}: ${value} is greater than maximum ${schema.maximum}`);
        if (typeof schema.exclusiveMinimum === "number" && value <= schema.exclusiveMinimum)
            errors.push(`${pointer(path)}: ${value} must be greater than ${schema.exclusiveMinimum}`);
        if (typeof schema.exclusiveMaximum === "number" && value >= schema.exclusiveMaximum)
            errors.push(`${pointer(path)}: ${value} must be less than ${schema.exclusiveMaximum}`);
        if (typeof schema.multipleOf === "number" && schema.multipleOf > 0 && Math.abs(value / schema.multipleOf - Math.round(value / schema.multipleOf)) > 1e-9) {
            errors.push(`${pointer(path)}: ${value} is not a multiple of ${schema.multipleOf}`);
        }
    }
    if (typeof value === "string") {
        const length = [...value].length;
        if (typeof schema.minLength === "number" && length < schema.minLength)
            errors.push(`${pointer(path)}: length ${length} is below minLength ${schema.minLength}`);
        if (typeof schema.maxLength === "number" && length > schema.maxLength)
            errors.push(`${pointer(path)}: length ${length} is above maxLength ${schema.maxLength}`);
        if (typeof schema.pattern === "string") {
            let re = null;
            try {
                re = new RegExp(schema.pattern);
            }
            catch {
                errors.push(`${pointer(path)}: schema pattern "${schema.pattern}" is not a valid regular expression`);
            }
            if (re && !re.test(value))
                errors.push(`${pointer(path)}: "${value.slice(0, 40)}" does not match pattern ${schema.pattern}`);
        }
    }
    if (Array.isArray(value)) {
        if (typeof schema.minItems === "number" && value.length < schema.minItems)
            errors.push(`${pointer(path)}: ${value.length} item(s) is below minItems ${schema.minItems}`);
        if (typeof schema.maxItems === "number" && value.length > schema.maxItems)
            errors.push(`${pointer(path)}: ${value.length} item(s) is above maxItems ${schema.maxItems}`);
        if (schema.uniqueItems === true) {
            const seen = new Set();
            value.forEach((item, i) => {
                const key = JSON.stringify(item);
                if (seen.has(key))
                    errors.push(`${pointer(`${path}/${i}`)}: duplicate item (uniqueItems)`);
                seen.add(key);
            });
        }
        if (schema.items !== undefined) {
            value.forEach((item, i) => validateValue(item, schema.items, `${path}/${i}`, errors, maxErrors));
        }
    }
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        if (Array.isArray(schema.required)) {
            for (const key of schema.required) {
                if (!(key in value))
                    errors.push(`${pointer(path)}: missing required property "${key}"`);
            }
        }
        const properties = schema.properties ?? {};
        for (const [key, sub] of Object.entries(properties)) {
            if (key in value)
                validateValue(value[key], sub, `${path}/${key}`, errors, maxErrors);
        }
        if (schema.additionalProperties === false) {
            for (const key of Object.keys(value)) {
                if (!(key in properties))
                    errors.push(`${pointer(path)}: property "${key}" is not allowed (additionalProperties: false)`);
            }
        }
        else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
            for (const key of Object.keys(value)) {
                if (!(key in properties))
                    validateValue(value[key], schema.additionalProperties, `${path}/${key}`, errors, maxErrors);
            }
        }
    }
    if (Array.isArray(schema.allOf)) {
        for (const sub of schema.allOf)
            validateValue(value, sub, path, errors, maxErrors);
    }
    if (Array.isArray(schema.anyOf)) {
        const ok = schema.anyOf.some((sub) => {
            const probe = [];
            validateValue(value, sub, path, probe, 1);
            return probe.length === 0;
        });
        if (!ok)
            errors.push(`${pointer(path)}: does not match any of the anyOf branches`);
    }
    if (Array.isArray(schema.oneOf)) {
        const passed = schema.oneOf.filter((sub) => {
            const probe = [];
            validateValue(value, sub, path, probe, 1);
            return probe.length === 0;
        }).length;
        if (passed !== 1)
            errors.push(`${pointer(path)}: matches ${passed} of the oneOf branches; exactly 1 is required`);
    }
    if (schema.not !== undefined) {
        const probe = [];
        validateValue(value, schema.not, path, probe, 1);
        if (probe.length === 0)
            errors.push(`${pointer(path)}: value matches the "not" schema but must not`);
    }
}
export async function validateJson(a) {
    const schema = parseJson("schema", a.schema);
    const instance = parseJson("instance", a.instance);
    const maxErrors = a.maxErrors ?? 20;
    if (!Number.isInteger(maxErrors) || maxErrors < 1 || maxErrors > 50)
        throw new SourceError("maxErrors must be between 1 and 50");
    const errors = [];
    validateValue(instance, schema, "", errors, maxErrors);
    if (!errors.length) {
        return ["Valid: the instance satisfies the schema.", "", `Instance keys: ${Object.keys(instance ?? {}).slice(0, 20).join(", ") || "(none)"}`].join("\n");
    }
    return [
        `Invalid: ${errors.length}${errors.length >= maxErrors ? "+" : ""} error(s) found (limit ${maxErrors}):`,
        "",
        ...errors.map((e) => `- ${e}`),
    ].join("\n");
}
function describe(schema, depth, maxDepth, indent, out) {
    if (schema === true) {
        out.push(`${indent}(anything)`);
        return;
    }
    if (schema === false) {
        out.push(`${indent}(nothing)`);
        return;
    }
    if (typeof schema !== "object" || schema === null) {
        out.push(`${indent}(invalid schema node)`);
        return;
    }
    const bits = [];
    if (schema.type)
        bits.push(Array.isArray(schema.type) ? schema.type.join("|") : String(schema.type));
    if (schema.const !== undefined)
        bits.push(`const ${JSON.stringify(schema.const)}`);
    if (Array.isArray(schema.enum))
        bits.push(`enum [${schema.enum.map((v) => JSON.stringify(v)).join(", ")}]`);
    if (typeof schema.minimum === "number")
        bits.push(`>= ${schema.minimum}`);
    if (typeof schema.maximum === "number")
        bits.push(`<= ${schema.maximum}`);
    if (typeof schema.minLength === "number")
        bits.push(`minLength ${schema.minLength}`);
    if (typeof schema.maxLength === "number")
        bits.push(`maxLength ${schema.maxLength}`);
    if (typeof schema.pattern === "string")
        bits.push(`pattern ${schema.pattern}`);
    if (typeof schema.minItems === "number")
        bits.push(`minItems ${schema.minItems}`);
    if (typeof schema.maxItems === "number")
        bits.push(`maxItems ${schema.maxItems}`);
    if (schema.additionalProperties === false)
        bits.push("no extra properties");
    if (Array.isArray(schema.required) && schema.required.length)
        bits.push(`required: ${schema.required.join(", ")}`);
    for (const combo of ["allOf", "anyOf", "oneOf"]) {
        if (Array.isArray(schema[combo]))
            bits.push(`${combo} (${schema[combo].length} branch(es))`);
    }
    if (schema.not !== undefined)
        bits.push("not");
    out.push(`${indent}- ${bits.join(" · ") || "(no constraints)"}`);
    if (depth >= maxDepth)
        return;
    if (schema.properties && typeof schema.properties === "object") {
        for (const [key, sub] of Object.entries(schema.properties)) {
            out.push(`${indent}  ${key}:`);
            describe(sub, depth + 1, maxDepth, indent + "    ", out);
        }
    }
    if (schema.items && typeof schema.items === "object") {
        out.push(`${indent}  [items]:`);
        describe(schema.items, depth + 1, maxDepth, indent + "    ", out);
    }
}
export async function describeSchema(a) {
    const schema = parseJson("schema", a.schema);
    const maxDepth = a.depth ?? 3;
    if (!Number.isInteger(maxDepth) || maxDepth < 1 || maxDepth > 6)
        throw new SourceError("depth must be between 1 and 6");
    const out = [];
    describe(schema, 1, maxDepth, "", out);
    const title = clean(schema?.title);
    return [
        title ? `Schema: ${title}` : "Schema outline:",
        "",
        ...out,
        "",
        maxDepth < 6 ? `(descended ${maxDepth} level(s); raise depth for more)` : "",
    ].filter(Boolean).join("\n");
}
function example(schema, depth) {
    if (depth > 6)
        return null;
    if (schema === false)
        return null;
    if (schema === undefined || schema === null || schema === true)
        return null;
    if (typeof schema !== "object")
        return null;
    if (schema.const !== undefined)
        return schema.const;
    if (Array.isArray(schema.enum) && schema.enum.length)
        return schema.enum[0];
    if (Array.isArray(schema.allOf) && schema.allOf.length)
        return example(schema.allOf[0], depth + 1);
    if (Array.isArray(schema.anyOf) && schema.anyOf.length)
        return example(schema.anyOf[0], depth + 1);
    if (Array.isArray(schema.oneOf) && schema.oneOf.length)
        return example(schema.oneOf[0], depth + 1);
    const types = schema.type ? (Array.isArray(schema.type) ? schema.type : [schema.type]) : [];
    const pick = types[0] ?? (schema.properties ? "object" : schema.items ? "array" : "string");
    if (pick === "object") {
        const required = Array.isArray(schema.required) ? schema.required : [];
        const properties = schema.properties ?? {};
        const keys = [...new Set([...required, ...Object.keys(properties).slice(0, Math.max(0, 4 - required.length))])];
        const obj = {};
        for (const key of keys)
            obj[key] = example(properties[key], depth + 1);
        return obj;
    }
    if (pick === "array") {
        const count = Math.max(1, schema.minItems ?? 1);
        return Array.from({ length: Math.min(count, 3) }, () => example(schema.items, depth + 1));
    }
    if (pick === "integer")
        return Math.max(0, Math.ceil(schema.minimum ?? 1));
    if (pick === "number")
        return typeof schema.minimum === "number" ? schema.minimum : 1.5;
    if (pick === "boolean")
        return true;
    if (pick === "null")
        return null;
    const minLength = Math.max(1, schema.minLength ?? 4);
    return "example".slice(0, Math.max(minLength, 1)).padEnd(Math.min(minLength, 40), "x");
}
export async function exampleFromSchema(a) {
    const schema = parseJson("schema", a.schema);
    const value = example(schema, 1);
    return [
        "Example instance that satisfies the schema:",
        "",
        JSON.stringify(value, null, 2),
    ].join("\n");
}
