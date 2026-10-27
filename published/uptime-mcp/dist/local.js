import * as tls from "node:tls";
import { UptimeError } from "./api.js";
function fmtDate(d) {
    return d.toISOString().slice(0, 10);
}
export async function cert(args) {
    const host = (args.host ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
    if (!host)
        throw new UptimeError("Provide a hostname like example.com");
    const cert = await new Promise((resolve) => {
        const socket = tls.connect({
            host,
            port: 443,
            servername: host,
            timeout: 12000,
            rejectUnauthorized: false,
        });
        socket.on("secureConnect", () => {
            try {
                const c = socket.getPeerCertificate();
                resolve(c && c.valid_to ? c : null);
            }
            catch {
                resolve(null);
            }
            finally {
                socket.end();
            }
        });
        socket.on("error", () => {
            resolve(null);
            socket.destroy();
        });
        socket.on("timeout", () => {
            resolve(null);
            socket.destroy();
        });
    });
    if (!cert)
        throw new UptimeError(`Could not get a TLS certificate for ${host}`);
    const validTo = new Date(cert.valid_to);
    const validFrom = new Date(cert.valid_from);
    const daysLeft = Math.floor((validTo.getTime() - Date.now()) / 86400000);
    const state = daysLeft < 0 ? "EXPIRED" : daysLeft < 30 ? "EXPIRING SOON" : "OK";
    const lines = [
        `Host: ${host}`,
        `Subject: ${cert.subject?.CN ?? "n/a"}`,
        `Issuer: ${cert.issuer?.O ?? cert.issuer?.CN ?? "n/a"}`,
        `Valid from: ${fmtDate(validFrom)}`,
        `Valid to: ${fmtDate(validTo)}`,
        `Days left: ${daysLeft}`,
        `State: ${state}`,
    ];
    return lines.join("\n");
}
