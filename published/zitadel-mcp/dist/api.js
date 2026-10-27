/**
 * Zitadel API v2 client. Points at any instance via ZITADEL_URL
 * (e.g. https://my-org.zitadel.cloud). Needs ZITADEL_TOKEN
 * (a service user PAT with user/org read permissions).
 * Docs: https://zitadel.com/docs/apis/introduction
 */
function base() {
    const url = (process.env.ZITADEL_URL ?? "").replace(/\/+$/, "");
    if (!url)
        throw new ZitadelError("Set ZITADEL_URL first (your instance, e.g. https://my-org.zitadel.cloud).");
    return url;
}
export class ZitadelError extends Error {
}
function headers() {
    const token = process.env.ZITADEL_TOKEN;
    if (!token)
        throw new ZitadelError("Set ZITADEL_TOKEN first (service user personal access token).");
    return { "User-Agent": "zitadel-mcp/1.0", Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}
async function postJson(path, body = {}) {
    const res = await fetch(`${base()}${path}`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new ZitadelError("Zitadel refused (401/403). Check URL and token.");
    if (res.status === 404)
        throw new ZitadelError("Not found. Check ZITADEL_URL.");
    if (!res.ok)
        throw new ZitadelError(`Zitadel error ${res.status}`);
    return (await res.json());
}
export async function listUsers(limit = 10) {
    const data = await postJson("/v2/users", { limit: Math.min(Math.max(limit, 1), 100) });
    const rows = Array.isArray(data.result) ? data.result : [];
    return rows.slice(0, limit).map((u) => ({
        id: String(u.userId ?? "?"),
        username: u.username,
        email: u.human?.email?.email,
        state: u.state,
    }));
}
export async function listOrganizations(limit = 10) {
    const data = await postJson("/v2/organizations", { limit: Math.min(Math.max(limit, 1), 100) });
    const rows = Array.isArray(data.result) ? data.result : [];
    return rows.slice(0, limit).map((o) => ({ id: String(o.organizationId ?? "?"), name: o.name, state: o.state }));
}
export function formatUser(u, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}[${u.id}] ${u.username ?? "(unnamed)"}${u.email ? ` <${u.email}>` : ""}${u.state ? ` [${u.state}]` : ""}`;
}
export function formatOrg(o, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}[${o.id}] ${o.name ?? "(unnamed)"}${o.state ? ` [${o.state}]` : ""}`;
}
// ---- muxE tools:
// The two existing tools read four fields out of a Zitadel user, and the shape
// of the v2 User message has more than that to say: a state, one or more login
// names, a preferred login name, a human block carrying a verified flag on the
// email and a password change date, or a machine block carrying a secret flag
// and an access token type, and an ObjectDetails block carrying when the record
// was created and last changed. Three questions follow from those, and none can
// be answered from a list of usernames: who is locked out or cannot log in at
// all, which accounts are stale, and which are machine credentials rather than
// people. Zitadel needs an instance URL and a personal access token and neither
// is present here, so these make no network call and read the payload the caller
// already has. The field names below come from Zitadel's own user.proto.
import { z } from "zod";
const Details = z.object({}).passthrough().optional();
const User = z
    .object({
    id: z.string().optional(),
    state: z.string().optional(),
    userName: z.string().optional(),
    loginNames: z.array(z.string()).optional(),
    preferredLoginName: z.string().optional(),
    orgId: z.string().optional(),
    details: z.object({ creationDate: z.string().optional(), changeDate: z.string().optional() }).passthrough().optional(),
    human: z
        .object({
        profile: z.object({ firstName: z.string().optional(), lastName: z.string().optional(), displayName: z.string().optional() }).passthrough().optional(),
        email: z.object({ email: z.string().optional(), isEmailVerified: z.boolean().optional() }).passthrough().optional(),
        phone: z.object({ phone: z.string().optional(), isPhoneVerified: z.boolean().optional() }).passthrough().optional(),
        passwordChanged: z.string().optional(),
    })
        .passthrough()
        .optional(),
    machine: z
        .object({
        name: z.string().optional(),
        description: z.string().optional(),
        hasSecret: z.boolean().optional(),
        accessTokenType: z.string().optional(),
    })
        .passthrough()
        .optional(),
})
    .passthrough();
const Org = z.object({ organizationId: z.string().optional(), id: z.string().optional(), name: z.string().optional(), state: z.string().optional() }).passthrough();
function usable(input) {
    if (!Array.isArray(input))
        return [];
    return input.filter((u) => !!u && typeof u === "object");
}
const orgId = (o) => o.organizationId ?? o.id ?? "?";
const orgName = (o) => o.name ?? orgId(o);
const userLabel = (u) => u.userName ?? u.preferredLoginName ?? u.human?.profile?.displayName ?? u.id ?? "?";
const emailOf = (u) => u.human?.email?.email;
const isMachine = (u) => !!u.machine;
const isHuman = (u) => !!u.human;
function group(rows, key) {
    const out = new Map();
    for (const r of rows)
        out.set(key(r), [...(out.get(key(r)) ?? []), r]);
    return out;
}
const daysSince = (iso, now) => {
    if (!iso)
        return null;
    const t = Date.parse(iso);
    if (Number.isNaN(t))
        return null;
    return Math.floor((now.getTime() - t) / 86400000);
};
const label = (u, key) => {
    if (key === "userName")
        return userLabel(u);
    if (key === "loginNames")
        return u.preferredLoginName ?? u.loginNames?.[0] ?? userLabel(u);
    if (key === "preferredLoginName")
        return u.preferredLoginName ?? u.loginNames?.[0] ?? userLabel(u);
    return u.id ?? userLabel(u);
};
const pct = (n, total) => (total > 0 ? `${((n / total) * 100).toFixed(0)}%` : "n/a");
export function audit_users(args) {
    const rows = usable(args?.users);
    if (!rows.length)
        return "Pass the result array from a Zitadel /v2/users response.";
    const now = args?.now && !Number.isNaN(Date.parse(args.now)) ? new Date(args.now) : new Date();
    const humans = rows.filter(isHuman);
    const machines = rows.filter(isMachine);
    const neither = rows.filter((u) => !isHuman(u) && !isMachine(u));
    const lines = [
        "Account hygiene across a Zitadel instance, from the /v2/users payload:",
        `  users: ${rows.length} — ${humans.length} human, ${machines.length} machine${machines.length === 1 ? "" : "s"}${neither.length ? `, ${neither.length} with neither block set` : ""}.`,
        `  states: ${[...group(rows, (u) => u.state ?? "not set")].map(([k, v]) => `${k} (${v.length})`).join(", ")}.`,
    ];
    const noLogin = rows.filter((u) => !(u.loginNames ?? []).length && !u.preferredLoginName);
    const noUserName = rows.filter((u) => !u.userName);
    const noEmail = humans.filter((u) => !emailOf(u));
    const unverified = humans.filter((u) => u.human?.email?.email && u.human?.email?.isEmailVerified === false);
    const neverChanged = rows.filter((u) => daysSince(u.details?.changeDate, now) === null);
    const ages = rows.map((u) => daysSince(u.details?.creationDate, now)).filter((d) => d !== null);
    lines.push(`  login: ${rows.length - noLogin.length} of ${rows.length} have at least one login name, ${noLogin.length} do not${noLogin.length ? ` (${noLogin.map((u) => userLabel(u)).join(", ")})` : ""}.`);
    lines.push(`  ${noUserName.length} record${noUserName.length === 1 ? " has" : "s have"} no userName at all.`);
    if (humans.length) {
        lines.push(`  of the ${humans.length} human(s), ${noEmail.length} have no email address${noEmail.length ? ` (${noEmail.map((u) => userLabel(u)).join(", ")})` : ""} and ${unverified.length} have an email that is not verified${unverified.length ? ` (${unverified.map((u) => emailOf(u)).join(", ")})` : ""}.`);
    }
    if (ages.length) {
        const sortedAges = [...ages].sort((a, b) => b - a);
        lines.push(`  account age: oldest ${sortedAges[0]} days, newest ${sortedAges[sortedAges.length - 1]} days, and ${neverChanged.length} record${neverChanged.length === 1 ? " has" : "s have"} never been changed since creation, which usually means the account was created and then abandoned.`);
    }
    else if (neverChanged.length === rows.length) {
        lines.push("  no record carries a creation or change date, so staleness cannot be judged from this payload.");
    }
    lines.push("");
    lines.push("  worth acting on:");
    let flags = 0;
    if (noLogin.length) {
        flags += 1;
        lines.push(`    ${noLogin.length} account${noLogin.length === 1 ? "" : "s"} cannot log in at all, having no login name and no preferred login name: ${noLogin.map((u) => userLabel(u)).join(", ")}. These are either service accounts meant to use a token, or accounts that were never finished.`);
    }
    const notActive = rows.filter((u) => u.state && !/^active$/i.test(u.state));
    if (notActive.length) {
        flags += 1;
        lines.push(`    ${notActive.length} account${notActive.length === 1 ? " is" : "s are"} not in the active state: ${notActive.map((u) => `${userLabel(u)} (${u.state})`).join(", ")}.`);
    }
    if (unverified.length) {
        flags += 1;
        lines.push(`    ${unverified.length} unverified email${unverified.length === 1 ? "" : "s"}, so a password reset to that address is being sent somewhere nobody has proven control of.`);
    }
    const staleAccounts = rows
        .map((u) => ({ u, d: daysSince(u.details?.changeDate, now) }))
        .filter((x) => x.d !== null && x.d > 365);
    if (staleAccounts.length) {
        flags += 1;
        lines.push(`    ${staleAccounts.length} account${staleAccounts.length === 1 ? "" : "s"} untouched for over a year: ${staleAccounts.map((x) => `${userLabel(x.u)} (${x.d}d)`).join(", ")}.`);
    }
    if (machines.length) {
        const withSecret = machines.filter((u) => u.machine?.hasSecret === true);
        lines.push(`    ${machines.length} machine account${machines.length === 1 ? "" : "s"}, of which ${withSecret.length} hold a secret and ${machines.length - withSecret.length} do not. A machine with no secret can still use a key or token, and that distinction decides whether rotating it breaks anything.`);
    }
    if (!flags)
        lines.push("    nothing stands out: every account is active, can log in, and has a verified email.");
    const byDomain = new Map();
    for (const u of rows) {
        for (const ln of u.loginNames ?? []) {
            const m = /@([^@]+)$/.exec(ln);
            const d = m ? m[1].toLowerCase() : "not an email-shaped login name";
            byDomain.set(d, (byDomain.get(d) ?? 0) + 1);
        }
    }
    if (byDomain.size) {
        lines.push("");
        lines.push(`  login name domains: ${[...byDomain.entries()].sort((a, b) => b[1] - a[1]).map(([d, n]) => `${d} (${n})`).join(", ")}.`);
        const realDomains = [...byDomain.entries()].filter(([d]) => d !== "not an email-shaped login name");
        if (realDomains.length > 1)
            lines.push(`  more than one domain is in use, so accounts are not all resolved against the same identity provider configuration.`);
    }
    return lines.join("\n");
}
export function credential_report(args) {
    const rows = usable(args?.users);
    if (!rows.length)
        return "Pass the result array from a Zitadel /v2/users response.";
    const machines = rows.filter(isMachine);
    const humans = rows.filter(isHuman);
    const lines = [
        "Which of these accounts are people and which are machine credentials, and how each one can log in:",
        `  ${humans.length} human, ${machines.length} machine, ${rows.length} in total.`,
    ];
    const nameCounts = rows.map((u) => (u.loginNames ?? []).length);
    const multi = rows.filter((u) => (u.loginNames ?? []).length > 1);
    lines.push(`  login names per account: ${nameCounts.length ? `minimum ${Math.min(...nameCounts)}, maximum ${nameCounts.length > 1 ? Math.max(...nameCounts) : Math.min(...nameCounts)}` : "none anywhere"}${multi.length ? `, and ${multi.length} account${multi.length === 1 ? " has" : "s have"} more than one.` : "."}`);
    if (multi.length) {
        lines.push("  accounts with more than one login name, which means they are reachable by more than one identifier:");
        for (const u of multi.slice(0, 15))
            lines.push(`    ${userLabel(u)}: ${(u.loginNames ?? []).join(", ")}`);
        if (multi.length > 15)
            lines.push(`    and ${multi.length - 15} more.`);
    }
    // Two different situations that the first version counted as one: an account
    // whose loginNames list exists but excludes its own preferredLoginName is a
    // real inconsistency, while an account with no loginNames at all is simply
    // carrying a preferred name and nothing to check it against.
    const mismatch = rows.filter((u) => u.preferredLoginName && (u.loginNames ?? []).length > 0 && !(u.loginNames ?? []).includes(u.preferredLoginName));
    const orphanPreferred = rows.filter((u) => u.preferredLoginName && !(u.loginNames ?? []).length);
    if (mismatch.length) {
        lines.push(`  ${mismatch.length} account${mismatch.length === 1 ? " has" : "s have"} a loginNames list that does not contain their own preferredLoginName (${mismatch.map((u) => `${userLabel(u)} prefers ${u.preferredLoginName}`).join("; ")}), so the field the API leads with is not one of the names the account answers to.`);
    }
    if (orphanPreferred.length) {
        lines.push(`  ${orphanPreferred.length} account${orphanPreferred.length === 1 ? " carries" : "s carry"} a preferredLoginName with no loginNames list at all (${orphanPreferred.map((u) => userLabel(u)).join(", ")}), which is a thinner record rather than a contradiction, and there is nothing here to check the preferred name against.`);
    }
    const emailish = rows.filter((u) => (u.loginNames ?? []).some((n) => n.includes("@")));
    const local = rows.filter((u) => (u.loginNames ?? []).length > 0 && !(u.loginNames ?? []).some((n) => n.includes("@")));
    const noneAtAll = rows.filter((u) => !(u.loginNames ?? []).length);
    // The consequence only follows when the bare-username group is non-empty, so
    // the sentence is branched rather than asserted whatever the counts are.
    lines.push(`  ${emailish.length} account${emailish.length === 1 ? " has" : "s have"} at least one email-shaped login name.`);
    lines.push(local.length
        ? `  ${local.length} ${local.length === 1 ? "has" : "have"} only a bare username (${local.map((u) => userLabel(u)).join(", ")}), which means ${local.length === 1 ? "it" : "they"} can only be reached through a default organisation domain or an IDP mapping rather than by typing a name.`
        : "  No account relies on a bare username alone, so none of them depends on a default organisation domain being configured for sign in.");
    if (noneAtAll.length)
        lines.push(`  ${noneAtAll.length} record${noneAtAll.length === 1 ? " has" : "s have"} no loginNames array at all (${noneAtAll.map((u) => userLabel(u)).join(", ")}).`);
    if (machines.length) {
        lines.push("");
        lines.push("  the machine accounts:");
        lines.push(`    ${"account".padEnd(28)}${"secret".padEnd(9)}${"token type".padEnd(16)}description`);
        for (const u of machines.slice(0, 20)) {
            const m = u.machine ?? {};
            lines.push(`    ${String(userLabel(u)).slice(0, 27).padEnd(28)}${(m.hasSecret === true ? "yes" : m.hasSecret === false ? "no" : "unset").padEnd(9)}${String(m.accessTokenType ?? "unset").slice(0, 15).padEnd(16)}${String(m.description ?? "").slice(0, 40)}`);
        }
        if (machines.length > 20)
            lines.push(`    and ${machines.length - 20} further machine account(s).`);
        const secrets = machines.filter((u) => u.machine?.hasSecret === true);
        const tokenTypes = new Map();
        for (const u of machines) {
            const t = u.machine?.accessTokenType ?? "unset";
            tokenTypes.set(t, (tokenTypes.get(t) ?? 0) + 1);
        }
        lines.push(`    ${secrets.length} of ${machines.length} hold a secret, and access token types in use: ${[...tokenTypes.entries()].map(([t, n]) => `${t} (${n})`).join(", ")}.`);
        if (secrets.length) {
            lines.push("    A machine account with a stored secret is a long lived credential by nature. These are the accounts worth rotating on a schedule, and the ones that should not have a description implying a human owner.");
            const undescribed = machines.filter((u) => !u.machine?.description);
            if (undescribed.length)
                lines.push(`    ${undescribed.length} machine account${undescribed.length === 1 ? " has" : "s have"} no description, so there is nothing on the record saying what the credential is for.`);
        }
    }
    else {
        lines.push("  There are no machine accounts in this payload, so every record here is a person.");
    }
    lines.push("");
    lines.push("  The existing list_users prints a username, an email and a state, so a machine account and a locked-out human are indistinguishable from an active one in that output.");
    return lines.join("\n");
}
export function org_coverage(args) {
    const rows = usable(args?.users);
    const orgs = Array.isArray(args?.organizations) ? args.organizations.filter((o) => !!o && typeof o === "object") : [];
    if (!rows.length && !orgs.length)
        return "Pass the result array from a Zitadel /v2/users response, and optionally the one from /v2/organizations.";
    const lines = ["How the user list is spread across organisations, from the /v2/users and /v2/organizations payloads:"];
    if (orgs.length)
        lines.push(`  organisations given: ${orgs.length}.`);
    lines.push(`  users given: ${rows.length}.`);
    const withOrg = rows.filter((u) => u.orgId);
    if (!withOrg.length) {
        lines.push("");
        lines.push("  No user in this payload carries an orgId, so membership cannot be attributed to an organisation from this data alone.");
        lines.push("  A /v2/users call is scoped to one organisation, so a list spanning several of them has to have been assembled from more than one call, and the organisation each row belongs to is then known to the caller rather than to the response.");
        if (orgs.length) {
            lines.push("");
            lines.push("  the organisations you did supply:");
            for (const o of orgs.slice(0, 25))
                lines.push(`    ${orgName(o)}${o.state ? ` (${o.state})` : ""} [${orgId(o)}]`);
            if (orgs.length > 25)
                lines.push(`    and ${orgs.length - 25} more.`);
        }
        return lines.join("\n");
    }
    const perOrg = group(withOrg, (u) => u.orgId);
    const byId = new Map(orgs.map((o) => [orgId(o), o]));
    lines.push("");
    lines.push(`  ${perOrg.size} organisation${perOrg.size === 1 ? "" : "s"} appear in the user list:`);
    for (const [id, list] of [...perOrg.entries()].sort((a, b) => b[1].length - a[1].length)) {
        const o = byId.get(id);
        const states = [...group(list, (u) => u.state ?? "not set")].map(([k, v]) => `${k} ${v.length}`).join(", ");
        lines.push(`    ${o ? orgName(o) : `unknown org ${id}`} — ${list.length} user${list.length === 1 ? "" : "s"} (${states})`);
    }
    const empty = orgs.filter((o) => !perOrg.has(orgId(o)));
    if (empty.length) {
        lines.push("");
        lines.push(`  ${empty.length} organisation${empty.length === 1 ? " has" : "s have"} no user in this list at all: ${empty.map((o) => orgName(o)).join(", ")}.`);
        lines.push("  An empty organisation is either a test left behind, or one whose users all live in another and are joining it through a membership mapping rather than directly.");
    }
    const names = new Map();
    for (const o of orgs) {
        const n = (o.name ?? "").trim().toLowerCase();
        if (n)
            names.set(n, [...(names.get(n) ?? []), orgId(o)]);
    }
    const clash = [...names.entries()].filter(([, ids]) => ids.length > 1);
    if (clash.length) {
        lines.push("");
        lines.push(`  ${clash.length} organisation name${clash.length === 1 ? "" : "s"} used more than once: ${clash.map(([n, ids]) => `${n} (${ids.length})`).join(", ")}. Zitadel allows it, and it makes the name useless for telling them apart.`);
    }
    const machine = withOrg.filter(isMachine).length;
    if (machine) {
        lines.push("");
        lines.push(`  ${machine} of the ${withOrg.length} attributed user${withOrg.length === 1 ? " is" : "s are"} machine accounts, spread as: ${[...group(withOrg.filter(isMachine), (u) => u.orgId)].map(([id, l]) => `${byId.get(id) ? orgName(byId.get(id)) : id} ${l.length}`).join(", ")}.`);
    }
    return lines.join("\n");
}
