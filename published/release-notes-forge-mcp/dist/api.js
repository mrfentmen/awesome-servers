// ---- muxB tools:
const MAX_CHANGELOG = 200000;
const SECTIONS = [
    { key: "Added", types: ["feat"] },
    { key: "Changed", types: ["perf", "refactor"] },
    { key: "Deprecated", types: [] },
    { key: "Removed", types: ["revert"] },
    { key: "Fixed", types: ["fix"] },
    { key: "Security", types: [] },
];
function pad(label, width = 20) {
    return label.length >= width ? label : label + " ".repeat(width - label.length);
}
export async function reviewChangelogCoverage(args) {
    const changelog = args.changelog ?? "";
    if (!changelog.trim())
        throw new Error("Provide changelog text in changelog to review");
    if (changelog.length > MAX_CHANGELOG)
        throw new Error(`Keep changelog under ${MAX_CHANGELOG} characters`);
    const lines = changelog.split(/\r?\n/);
    const sectionCounts = new Map();
    const versionHeadings = { count: 0, unreleased: 0, unmatched: 0 };
    let current = null;
    let bullets = 0;
    let typed = 0;
    const seen = new Map();
    let duplicates = 0;
    for (const line of lines) {
        const heading = /^(#{1,4})\s+(.*\S)\s*$/.exec(line);
        if (heading) {
            const title = heading[2].trim();
            if (heading[1].length <= 2 && /^\[?v?\d/.test(title))
                versionHeadings.count += 1;
            if (/^[\[(]*unreleased/i.test(title)) {
                versionHeadings.unreleased += 1;
                current = "Unreleased";
            }
            else {
                const matched = SECTIONS.find((section) => new RegExp(`^${section.key}\\b`, "i").test(title));
                if (matched)
                    current = matched.key;
                else if (/^(?:added|changed|deprecated|removed|fixed|security)\\b/i.test(title))
                    current = title.replace(/[: ].*$/, "").replace(/^./, (c) => c.toUpperCase());
                else
                    current = null;
            }
            if (current)
                sectionCounts.set(current, sectionCounts.get(current) ?? 0);
            continue;
        }
        const item = /^\s*[-*+]\s+(\S.*)$/.exec(line);
        if (!item)
            continue;
        bullets += 1;
        if (current)
            sectionCounts.set(current, (sectionCounts.get(current) ?? 0) + 1);
        const entry = item[1].replace(/^`[^`]*`\s*/, "").replace(/[*_`]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
        if (/^(?:feat|fix|docs|perf|refactor|test|build|ci|chore|revert|style)\b/i.test(entry))
            typed += 1;
        if (entry.length >= 8) {
            const key = entry.slice(0, 120);
            if (seen.has(key))
                duplicates += 1;
            else
                seen.set(key, 1);
        }
    }
    const missing = SECTIONS.filter((section) => !sectionCounts.has(section.key)).map((section) => section.key);
    const emptySections = [...sectionCounts.entries()].filter(([, count]) => count === 0).map(([key]) => key);
    const out = [];
    out.push(`Changelog coverage review (${lines.length} lines, ${changelog.length} characters; entry text is never echoed)`);
    out.push(`${pad("Version headings")}${versionHeadings.count} release heading${versionHeadings.count === 1 ? "" : "s"}, ${versionHeadings.unreleased} marked unreleased`);
    out.push(`${pad("Entries")}${bullets} list items, ${typed} carrying a conventional type prefix`);
    out.push(`${pad("Per section")}${[...sectionCounts.entries()].sort().map(([key, count]) => `${key}=${count}`).join("  ") || "no recognised sections"}`);
    out.push(`${pad("Duplicates")}${duplicates} entr${duplicates === 1 ? "y repeats" : "ies repeat"} an earlier entry`);
    out.push(`${pad("Missing sections")}${missing.length ? missing.join(", ") : "none of the Keep a Changelog sections is absent"}`);
    out.push(`${pad("Empty sections")}${emptySections.length ? emptySections.join(", ") : "no recognised section is present but empty"}`);
    out.push(`${pad("Verdict")}${!versionHeadings.count ? "no release heading was found, so this is not a Keep a Changelog file" : missing.length > 2 ? "several standard sections are missing, readers will not know where to look" : duplicates > 0 ? "structure is usable but there are duplicate entries to remove" : "the changelog covers the standard sections and looks releasable"}`);
    out.push("Entry text, commit messages, hashes, paths, branch names, remotes and author identities are never returned.");
    return out.join("\n");
}
