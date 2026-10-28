/**
 * vCard — keyless public API client.
 */
export class SourceError extends Error {
}
export function clampLimit(n, fallback, max) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
function unfold(text) {
    const raw = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    const lines = [];
    for (const line of raw) {
        if (/^[ \t]/.test(line) && lines.length)
            lines[lines.length - 1] += line.slice(1);
        else if (line !== "")
            lines.push(line);
    }
    return lines;
}
function parseProp(line) {
    const colon = line.indexOf(":");
    if (colon < 0)
        throw new SourceError(`property without a colon: "${line.slice(0, 60)}"`);
    const head = line.slice(0, colon);
    const bits = head.split(";");
    const params = {};
    for (const bit of bits.slice(1)) {
        const eq = bit.indexOf("=");
        const key = (eq < 0 ? bit : bit.slice(0, eq)).toUpperCase();
        params[key] = eq < 0 ? "true" : bit.slice(eq + 1);
    }
    return { name: bits[0].toUpperCase(), params, value: line.slice(colon + 1) };
}
function unescapeValue(value) {
    return value.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}
function escapeValue(value) {
    return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
function parseCards(text) {
    const cards = [];
    let current = null;
    for (const line of unfold(text)) {
        const prop = parseProp(line);
        if (prop.name === "BEGIN") {
            const kind = prop.value.toUpperCase();
            if (kind === "VCARD") {
                if (current)
                    throw new SourceError("nested BEGIN:VCARD");
                current = { version: "", props: [] };
            }
            else if (!current) {
                throw new SourceError(`BEGIN:${kind} outside a vCard`);
            }
            continue;
        }
        if (prop.name === "END") {
            if (!current)
                throw new SourceError(`END:${prop.value} without a BEGIN:VCARD`);
            cards.push(current);
            current = null;
            continue;
        }
        if (!current)
            throw new SourceError("property outside any BEGIN:VCARD block");
        if (prop.name === "VERSION")
            current.version = prop.value;
        current.props.push(prop);
    }
    if (current)
        throw new SourceError("BEGIN:VCARD is never closed");
    if (!cards.length)
        throw new SourceError("no vCard found in the text");
    return cards;
}
function values(card, name) {
    return card.props.filter((p) => p.name === name);
}
function first(card, name) {
    const prop = values(card, name)[0];
    return prop ? unescapeValue(prop.value) : "";
}
function structuredName(card) {
    const n = first(card, "N");
    if (!n)
        return "";
    const parts = n.split(";");
    const family = (parts[0] ?? "").trim();
    const given = (parts[1] ?? "").trim();
    if (!family && !given)
        return "";
    return [given, family].filter(Boolean).join(" ");
}
function splitList(value) {
    if (!value)
        return [];
    return value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
}
function kindLabel(prop) {
    const type = prop.params.TYPE ?? "";
    return type ? ` (${type.toLowerCase()})` : "";
}
export async function parseVcard(a) {
    const limit = clampLimit(a.limit, 5, 20);
    const cards = parseCards(a.text);
    const lines = [`${cards.length} vCard(s) found${cards[0]?.version ? ` · version ${cards[0].version}` : ""}`];
    for (const card of cards.slice(0, limit)) {
        const name = first(card, "FN") || structuredName(card) || "(no name)";
        lines.push("", `${name}${card.version ? `  [v${card.version}]` : ""}`);
        const org = first(card, "ORG");
        const title = first(card, "TITLE");
        const note = first(card, "NOTE");
        if (org)
            lines.push(`  org:    ${org}`);
        if (title)
            lines.push(`  title:  ${title}`);
        for (const tel of values(card, "TEL"))
            lines.push(`  phone:  ${unescapeValue(tel.value).replace(/^tel:/i, "")}${kindLabel(tel)}`);
        for (const email of values(card, "EMAIL"))
            lines.push(`  email:  ${unescapeValue(email.value).replace(/^mailto:/i, "")}${kindLabel(email)}`);
        for (const url of values(card, "URL"))
            lines.push(`  url:    ${unescapeValue(url.value)}`);
        const adr = first(card, "ADR");
        if (adr) {
            const parts = adr.split(";").map((p) => p.trim()).filter(Boolean);
            lines.push(`  address: ${parts.join(", ")}`);
        }
        if (note)
            lines.push(`  note:   ${note.split("\n").join(" / ").slice(0, 200)}`);
        if (values(card, "BDAY")[0])
            lines.push(`  birthday: ${first(card, "BDAY")}`);
    }
    if (cards.length > limit)
        lines.push("", `... ${cards.length - limit} more card(s) not shown.`);
    return lines.join("\n");
}
export async function vcardToJson(a) {
    const limit = clampLimit(a.limit, 5, 20);
    const cards = parseCards(a.text);
    const json = cards.slice(0, limit).map((card) => ({
        version: card.version || null,
        formattedName: first(card, "FN") || null,
        name: (() => {
            const n = first(card, "N");
            if (!n)
                return null;
            const parts = n.split(";");
            return { family: parts[0] || null, given: parts[1] || null, middle: parts[2] || null, prefix: parts[3] || null, suffix: parts[4] || null };
        })(),
        org: first(card, "ORG") || null,
        title: first(card, "TITLE") || null,
        phones: values(card, "TEL").map((p) => ({ value: unescapeValue(p.value).replace(/^tel:/i, ""), type: p.params.TYPE ?? null })),
        emails: values(card, "EMAIL").map((p) => ({ value: unescapeValue(p.value).replace(/^mailto:/i, ""), type: p.params.TYPE ?? null })),
        urls: values(card, "URL").map((p) => unescapeValue(p.value)),
        address: first(card, "ADR") || null,
        note: first(card, "NOTE") || null,
        birthday: first(card, "BDAY") || null,
    }));
    const text = JSON.stringify(json, null, 2);
    return [text.length > 6000 ? text.slice(0, 6000) + "\n... (truncated at 6000 characters)" : text].join("");
}
export async function createVcard(a) {
    const fullName = clean(a.fullName);
    if (!fullName)
        throw new SourceError("fullName is required");
    const phones = splitList(a.phones);
    const emails = splitList(a.emails);
    for (const email of emails) {
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
            throw new SourceError(`"${email}" does not look like an email address`);
    }
    const family = clean(a.lastName) || (fullName.includes(" ") ? fullName.split(/\s+/).slice(1).join(" ") : "");
    const given = clean(a.firstName) || (fullName.includes(" ") ? fullName.split(/\s+/)[0] : fullName);
    const lines = [
        "BEGIN:VCARD",
        "VERSION:4.0",
        `FN:${escapeValue(fullName)}`,
        `N:${escapeValue(family)};${escapeValue(given)};;;`,
        a.org ? `ORG:${escapeValue(clean(a.org))}` : "",
        a.title ? `TITLE:${escapeValue(clean(a.title))}` : "",
        ...phones.map((phone) => `TEL;VALUE=uri:tel:${phone.replace(/[^\d+]/g, "")}`),
        ...emails.map((email) => `EMAIL:${escapeValue(email)}`),
        a.url ? `URL:${escapeValue(clean(a.url))}` : "",
        a.note ? `NOTE:${escapeValue(clean(a.note))}` : "",
        "END:VCARD",
    ].filter(Boolean);
    return [
        `vCard built for ${fullName} (${lines.length} lines):`,
        "",
        lines.join("\r\n"),
    ].join("\n");
}
