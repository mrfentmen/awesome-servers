import zxcvbn from "zxcvbn";
const UA = "mrfentmen-password-strength-mcp/1.0";
export class PasswordError extends Error {
}
export async function checkPassword(args) {
    const password = (args.password ?? "").trim();
    if (!password)
        throw new PasswordError("Provide a password to check");
    const r = zxcvbn(password);
    const labels = ["very weak", "weak", "fair", "strong", "very strong"];
    const crack = r.crack_times_display?.offline_slow_hashing_1e4_per_second ?? "n/a";
    const lines = [
        `Score: ${r.score}/4 (${labels[r.score] ?? "unknown"})`,
        `Estimated time to crack (offline, slow): ${crack}`,
        `Guesses: ${r.guesses?.toLocaleString() ?? "n/a"}`,
    ];
    if (r.feedback?.warning)
        lines.push(`Warning: ${r.feedback.warning}`);
    if (r.feedback?.suggestions?.length)
        lines.push(`Suggestions: ${r.feedback.suggestions.slice(0, 3).join("; ")}`);
    return lines.join("\n");
}
// ---- muxF tools:
import { createRequire } from "node:module";
const nodeRequire = createRequire(import.meta.url);
const LISTS = nodeRequire("zxcvbn/lib/frequency_lists.js");
const GRAPHS = nodeRequire("zxcvbn/lib/adjacency_graphs.js");
const LIST_LABELS = {
    passwords: "30k most used passwords",
    english_wikipedia: "30k most frequent English Wikipedia words",
    us_tv_and_film: "19k common US television and film words",
    surnames: "10k most common surnames",
    female_names: "3.7k common female given names",
    male_names: "1k common male given names",
};
function positionsOf(graph) {
    const positions = new Map();
    for (const [row, rowKeys] of Object.entries(graph)) {
        const y = Number(row);
        if (!Number.isFinite(y))
            continue;
        (rowKeys ?? []).forEach((cell, x) => {
            const chars = typeof cell === "string" ? cell : "";
            for (const ch of chars) {
                const list = positions.get(ch) ?? [];
                list.push([x, y]);
                positions.set(ch, list);
            }
        });
    }
    return positions;
}
function indexOf(list) {
    const index = new Map();
    list.forEach((word, rank) => {
        if (!index.has(word))
            index.set(word, rank + 1);
    });
    return index;
}
const LIST_INDEX = Object.fromEntries(Object.entries(LISTS).map(([k, v]) => [k, indexOf(v)]));
/** Where a password sits in the word lists zxcvbn ships, and which parts of it come from them. */
export async function commonListRank(args) {
    const password = (args.password ?? "").trim();
    if (!password)
        throw new PasswordError("Provide a password to look up");
    const lower = password.toLowerCase();
    const hits = [];
    for (const [name, index] of Object.entries(LIST_INDEX)) {
        const exact = index.get(lower);
        if (exact)
            hits.push(`${LIST_LABELS[name] ?? name}: exact match at rank ${exact} of ${LISTS[name].length}`);
    }
    const words = lower.split(/[^a-z0-9']+/).filter((p) => p.length >= 3);
    const parts = [];
    for (const part of words.slice(0, 8)) {
        const found = [];
        for (const [name, index] of Object.entries(LIST_INDEX)) {
            const rank = index.get(part);
            if (rank)
                found.push(`${name} #${rank}`);
        }
        if (found.length)
            parts.push(`  "${part}" appears in ${found.slice(0, 4).join(", ")}`);
    }
    const lines = [
        `Word list lookup for a ${password.length} character candidate`,
        hits.length ? `Whole-candidate matches: ${hits.join("; ")}` : "Whole-candidate matches: none, it is not itself a listed word",
        parts.length ? `Components found in the lists:` : "No component of 3 characters or more is a listed word",
        ...parts,
        `Lists searched: ${Object.keys(LIST_INDEX).map((k) => `${k} (${LISTS[k].length})`).join(", ")}`,
    ];
    return lines.join("\n");
}
/** Read a string as a walk across the keyboard layouts zxcvbn ships graphs for. */
export async function keyboardWalk(args) {
    const password = (args.password ?? "");
    if (!password)
        throw new PasswordError("Provide a password to read as a keyboard walk");
    const walks = [];
    for (const [layout, graph] of Object.entries(GRAPHS)) {
        const positions = positionsOf(graph);
        const chars = [...password];
        let covered = 0;
        let steps = 0;
        let breaks = 0;
        let run = 1;
        let longestRun = 0;
        let previous = null;
        let previousStep = null;
        for (const ch of chars) {
            const here = positions.get(ch)?.[0] ?? positions.get(ch.toLowerCase())?.[0];
            if (!here) {
                previous = null;
                previousStep = null;
                continue;
            }
            covered += 1;
            if (previous) {
                steps += 1;
                const dx = here[0] - previous[0];
                const dy = here[1] - previous[1];
                const same = previousStep ? dx === previousStep[0] && dy === previousStep[1] : true;
                if (same) {
                    run += 1;
                }
                else {
                    breaks += 1;
                    run = 1;
                }
                previousStep = [dx, dy];
                if (run > longestRun)
                    longestRun = run;
            }
            else {
                run = 1;
            }
            previous = here;
        }
        if (covered)
            walks.push({ layout, covered, steps, breaks, longestRun });
    }
    if (!walks.length) {
        const typed = new Set([...password.toLowerCase()].filter((c) => c >= "a" && c <= "z")).size;
        return `None of the ${Object.keys(GRAPHS).length} keyboard layouts zxcvbn ships place the characters in "${password.slice(0, 40)}" (${typed} distinct letters). It is not a keyboard walk.`;
    }
    const lines = [`Keyboard walk analysis of a ${password.length} character candidate`];
    for (const w of walks) {
        lines.push(`${w.layout}: ${w.covered} of ${password.length} characters sit on this layout, ` +
            `${w.steps} adjacent step(s), ${w.breaks} direction change(s), longest straight run ${w.longestRun}`);
    }
    const best = [...walks].sort((a, b) => b.covered - a.covered || a.breaks - b.breaks)[0];
    lines.push(`Closest fit: ${best.layout}${best.covered === password.length ? ", every character is on it" : `, ${password.length - best.covered} character(s) are not on it`}.`);
    lines.push("A walk with few direction changes is cheap for an attacker to guess, because the guesses multiply per turn.");
    return lines.join("\n");
}
/** Score the mutations an attacker would try first, to show how little a tweak buys. */
export async function variantAudit(args) {
    const password = (args.password ?? "").trim();
    if (!password)
        throw new PasswordError("Provide a password to mutate");
    const lower = password.toLowerCase();
    const leet = lower
        .replace(/a/g, "@")
        .replace(/e/g, "3")
        .replace(/i/g, "1")
        .replace(/o/g, "0")
        .replace(/s/g, "$");
    const mutations = [
        ["as typed", password],
        ["lower case", lower],
        ["capitalised", lower.charAt(0).toUpperCase() + lower.slice(1)],
        ["upper case", lower.toUpperCase()],
        ["with a trailing !", `${password}!`],
        ["with a trailing 1", `${password}1`],
        ["with a trailing 123", `${password}123`],
        ["with a trailing 2024", `${password}2024`],
        ["with a trailing 2025", `${password}2025`],
        ["with an interior digit", /[0-9]/.test(password) ? lower : `${lower}7`],
        ["l33t substituted", leet === lower ? `${lower}!@#` : leet],
        ["reversed", [...password].reverse().join("")],
    ];
    const unique = new Map();
    for (const [label, value] of mutations) {
        if (value && value !== password)
            unique.set(value, label);
    }
    const scored = [...unique.entries()].map(([value, label]) => {
        const r = zxcvbn(value);
        return { label, value, score: r.score, guesses: r.guesses, warning: r.feedback?.warning ?? "" };
    });
    const labels = ["very weak", "weak", "fair", "strong", "very strong"];
    const base = zxcvbn(password);
    const weakest = scored.reduce((min, s) => (s.guesses < min.guesses ? s : min), scored[0] ?? { guesses: base.guesses, label: "as typed", score: base.score, value: password, warning: "" });
    return [
        `Mutation audit: ${unique.size} nearby candidate(s) an attacker would try`,
        `Original: score ${base.score}/4 (${labels[base.score]}), ${base.guesses.toLocaleString()} guesses`,
        ...scored.map((s) => `- ${s.label} (${s.value.slice(0, 24)}): score ${s.score}/4, ${s.guesses.toLocaleString()} guesses${s.warning ? `, warning: ${s.warning}` : ""}`),
        `Weakest mutation: ${weakest.label} at ${weakest.guesses.toLocaleString()} guesses, score ${weakest.score}/4.`,
    ].join("\n");
}
