import { connect } from "node:net";
import { PortError } from "./api.js";
function check(host, port, timeoutMs) {
    return new Promise((resolve) => {
        const sock = connect({ host, port });
        let done = false;
        const finish = (open) => {
            if (done)
                return;
            done = true;
            sock.destroy();
            resolve(open);
        };
        sock.setTimeout(timeoutMs);
        sock.once("connect", () => finish(true));
        sock.once("timeout", () => finish(false));
        sock.once("error", () => finish(false));
    });
}
export async function scanHost(args) {
    const host = (args.host ?? "").trim();
    if (!host)
        throw new PortError("Provide a host name or IP");
    const timeoutMs = Math.min(Math.max(args.timeout_ms ?? 1000, 100), 2000);
    const ports = (args.ports ?? "80,443,22,21,25,53,8080,3306,5432,6379")
        .split(",").map((p) => parseInt(p.trim(), 10)).filter((p) => p >= 1 && p <= 65535).slice(0, 50);
    if (!ports.length)
        throw new PortError("Provide a valid port list");
    const results = [];
    for (const p of ports) {
        const open = await check(host, p, timeoutMs);
        results.push(`${p}: ${open ? "OPEN" : "closed"}`);
    }
    return `Scan of ${host}:\n${results.join("\n")}`;
}
export async function scanCommon(args) {
    const host = (args.host ?? "").trim();
    if (!host)
        throw new PortError("Provide a host name or IP");
    const common = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 993, 995, 1433, 1521, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 9000, 27017];
    const results = [];
    for (const p of common) {
        const open = await check(host, p, 800);
        if (open)
            results.push(`${p}: OPEN`);
    }
    return results.length
        ? `Open ports on ${host}:\n${results.join("\n")}`
        : `No common ports open on ${host}`;
}
