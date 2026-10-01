export class LinearError extends Error {
    constructor(message) {
        super(message);
        this.name = "LinearError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function key() {
    const k = process.env.LINEAR_API_KEY;
    if (!k)
        throw new LinearError("Set LINEAR_API_KEY (Linear personal key).");
    return k;
}
async function gql(query, variables = {}) {
    let res;
    try {
        res = await fetch("https://api.linear.app/graphql", {
            method: "POST",
            headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: key() },
            body: JSON.stringify({ query, variables }),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new LinearError(`Network error: ${e.message}`);
    }
    const text = await res.text();
    if (!res.ok)
        throw new LinearError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 12000);
}
export function me() {
    return gql("query { viewer { id name email } }");
}
export function listTeams() {
    return gql("query { teams { nodes { id name key } } }");
}
export function searchIssues(term, limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 50);
    return gql("query($t: String!, $n: Int!) { searchIssues(term: $t, first: $n) { nodes { id identifier title state { name } } } }", { t: term, n });
}
export function getIssue(issueId) {
    return gql("query($id: String!) { issue(id: $id) { id identifier title description state { name } } }", { id: issueId });
}
export function teamIssues(teamId, limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 50);
    return gql("query($t: String!, $n: Int!) { team(id: $t) { issues(first: $n) { nodes { id identifier title state { name } } } } }", { t: teamId, n });
}
export function listProjects() {
    return gql("query { projects(first: 20) { nodes { id name state } } }");
}
export function myIssues(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 50);
    return gql("query($n: Int!) { viewer { assignedIssues(first: $n) { nodes { id identifier title state { name } } } } }", { n });
}
export function listLabels(teamId) {
    return gql("query($t: String!) { team(id: $t) { labels(first: 50) { nodes { id name color } } } }", { t: teamId });
}
export function createIssue(teamId, title, description) {
    return gql("mutation($t: String!, $ti: String!, $d: String) { issueCreate(input: { teamId: $t, title: $ti, description: $d }) { success issue { id identifier } } }", { t: teamId, ti: title, d: description ?? "" });
}
export function updateIssueTitle(issueId, title) {
    return gql("mutation($id: String!, $ti: String!) { issueUpdate(id: $id, input: { title: $ti }) { success issue { id identifier title } } }", { id: issueId, ti: title });
}
// The scorecard path includes the forge host, so github.com/owner/repo is the
// default and a full repository URL is accepted as written.
